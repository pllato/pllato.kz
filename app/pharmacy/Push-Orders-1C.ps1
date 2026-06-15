# ============================================================
#  Push-Orders-1C.ps1 — заказы CRM → 1С (ЗаказПокупателя через COM)
#  Запуск: powershell -NoProfile -ExecutionPolicy Bypass -File .\Push-Orders-1C.ps1
#  Конфиг (sync-config.json рядом), доп.ключи:
#    comUser, comPassword — пользователь 1С с правом «Внешнее соединение» (можно админ)
#    comFile         — путь к базе (по умолч. C:\Base1c\Розница_ЦБ_Тест)
#    defaultOrgKey   — GUID организации по умолчанию (если в заказе пусто)
#    defaultStoreKey — (опц.) GUID склада (СтруктурнаяЕдиницаПродажи)
#    platformBin     — (опц.) путь к bin платформы 1С
#  ВАЖНО: пишем ТОЛЬКО в тест-базу. Боевую базу не трогаем (comFile = тест).
# ============================================================
param([string]$ConfigPath = "$PSScriptRoot\sync-config.json")
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$cfg = Get-Content $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
$logDir = "$PSScriptRoot\logs"; New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logFile = "$logDir\push-orders-$((Get-Date).ToString('yyyyMMdd')).log"
function Log($m){ ("[{0}] {1}" -f (Get-Date).ToString('HH:mm:ss'), $m) | Tee-Object -FilePath $logFile -Append }

Log "===== Push-Orders старт ====="
$secHdr = @{ 'X-Sync-Secret' = $cfg.syncSecret }
$ackHdr = @{ 'X-Sync-Secret' = $cfg.syncSecret; 'Content-Type' = 'application/json; charset=utf-8' }

# 1) очередь из воркера
try { $obx = Invoke-RestMethod -Uri ($cfg.workerUrl + '/api/sync/1c/outbox') -Headers $secHdr -Method GET }
catch { Log "ОШИБКА получения очереди: $($_.Exception.Message)"; exit 1 }
$orders = @($obx.orders)
$clients = @($obx.clients)
$promos = @($obx.promos)
Log "в очереди: заказов $($orders.Count), клиентов $($clients.Count), промокодов $($promos.Count)"
if ($orders.Count -eq 0 -and $clients.Count -eq 0 -and $promos.Count -eq 0) { Log "===== нечего отправлять ====="; exit 0 }

# 2) COM-подключение к 1С (нужно право «Внешнее соединение»)
$comUser = if ($cfg.comUser) { $cfg.comUser } else { $cfg.odataUser }
$comPass = if ($cfg.comPassword) { $cfg.comPassword } else { $cfg.odataPassword }
$comFile = if ($cfg.comFile) { $cfg.comFile } else { 'C:\Base1c\Розница_ЦБ_Тест' }
$bin     = if ($cfg.platformBin) { $cfg.platformBin } else { 'C:\Program Files\1cv8\8.3.23.1912\bin' }
try { $conn = New-Object -ComObject 'V83.COMConnector' }
catch { Log 'регистрирую comcntr.dll'; & regsvr32 /s "$bin\comcntr.dll"; Start-Sleep 2; $conn = New-Object -ComObject 'V83.COMConnector' }
$cs = 'File="' + $comFile + '";Usr="' + $comUser + '";Pwd="' + $comPass + '"'
try { $ib = $conn.Connect($cs); Log "COM подключение OK ($comFile)" }
catch { Log "COM подключение НЕ удалось: $($_.Exception.Message)"; exit 1 }

$C   = [System.__ComObject]
$get = [System.Reflection.BindingFlags]::GetProperty
$inv = [System.Reflection.BindingFlags]::InvokeMethod
$set = [System.Reflection.BindingFlags]::SetProperty

# менеджеры (прямое присваивание — без разворачивания COM-коллекций)
$docsMgr = $C.InvokeMember('Документы',$get,$null,$ib,$null)
$zpMgr   = $C.InvokeMember('ЗаказПокупателя',$get,$null,$docsMgr,$null)
$cats    = $C.InvokeMember('Справочники',$get,$null,$ib,$null)
$orgCat  = $C.InvokeMember('Организации',$get,$null,$cats,$null)
$nomCat  = $C.InvokeMember('Номенклатура',$get,$null,$cats,$null)

$results = @()
foreach ($o in $orders) {
  try {
    # отмена заказа: помечаем документ в 1С на удаление
    if ($o.op -eq 'cancel') {
      $qd = $C.InvokeMember('NewObject',$inv,$null,$ib,@('Запрос'))
      [void]$C.InvokeMember('Текст',$set,$null,$qd,@('ВЫБРАТЬ ПЕРВЫЕ 1 ЗаказПокупателя.Ссылка КАК Ссылка ИЗ Документ.ЗаказПокупателя КАК ЗаказПокупателя ГДЕ ЗаказПокупателя.Комментарий ПОДОБНО &Шаблон'))
      [void]$C.InvokeMember('УстановитьПараметр',$inv,$null,$qd,@('Шаблон',"%CRM-заказ #$($o.id)%"))
      $seld = $C.InvokeMember('Выбрать',$inv,$null,($C.InvokeMember('Выполнить',$inv,$null,$qd,@())),@())
      if ($C.InvokeMember('Следующий',$inv,$null,$seld,@())) {
        $dref = $C.InvokeMember('Ссылка',$get,$null,$seld,$null)
        $dobj = $C.InvokeMember('ПолучитьОбъект',$inv,$null,$dref,@())
        try { [void]$C.InvokeMember('ОтменитьПроведение',$inv,$null,$dobj,@()) } catch {}
        [void]$C.InvokeMember('УстановитьПометкуУдаления',$inv,$null,$dobj,@($true))
        Log "OK заказ $($o.id) -> помечен на удаление в 1С (отмена)"
      } else {
        Log "CANCEL заказ $($o.id) — документ в 1С не найден"
      }
      $results += @{ id = $o.id; ok = $true; op = 'cancel' }
      continue
    }
    # идемпотентность: если документ с этим CRM-id уже есть в 1С — не создаём повторно
    $q = $C.InvokeMember('NewObject',$inv,$null,$ib,@('Запрос'))
    [void]$C.InvokeMember('Текст',$set,$null,$q,@('ВЫБРАТЬ ПЕРВЫЕ 1 ЗаказПокупателя.Номер КАК Номер ИЗ Документ.ЗаказПокупателя КАК ЗаказПокупателя ГДЕ ЗаказПокупателя.Комментарий ПОДОБНО &Шаблон'))
    [void]$C.InvokeMember('УстановитьПараметр',$inv,$null,$q,@('Шаблон',"%CRM-заказ #$($o.id)%"))
    $sel = $C.InvokeMember('Выбрать',$inv,$null,($C.InvokeMember('Выполнить',$inv,$null,$q,@())),@())
    if ($C.InvokeMember('Следующий',$inv,$null,$sel,@())) {
      $existNum = [string]$C.InvokeMember('Номер',$get,$null,$sel,$null)
      Log "SKIP заказ $($o.id) — уже в 1С № $existNum (дубль предотвращён)"
      $results += @{ id = $o.id; ok = $true; number = $existNum }
      continue
    }
    $doc = $C.InvokeMember('СоздатьДокумент',$inv,$null,$zpMgr,@())
    [void]$C.InvokeMember('Дата',$set,$null,$doc,@([DateTime]::Now))

    $orgKey = if ($o.org_key) { [string]$o.org_key } elseif ($cfg.defaultOrgKey) { [string]$cfg.defaultOrgKey } else { '' }
    if ($orgKey) {
      $g   = $C.InvokeMember('NewObject',$inv,$null,$ib,@('УникальныйИдентификатор',$orgKey))
      $ref = $C.InvokeMember('ПолучитьСсылку',$inv,$null,$orgCat,@($g))
      [void]$C.InvokeMember('Организация',$set,$null,$doc,@($ref))
    }
    if ($cfg.defaultStoreKey) {
      $seCat = $C.InvokeMember('СтруктурныеЕдиницы',$get,$null,$cats,$null)
      $gs    = $C.InvokeMember('NewObject',$inv,$null,$ib,@('УникальныйИдентификатор',[string]$cfg.defaultStoreKey))
      $sref  = $C.InvokeMember('ПолучитьСсылку',$inv,$null,$seCat,@($gs))
      [void]$C.InvokeMember('СтруктурнаяЕдиницаПродажи',$set,$null,$doc,@($sref))
    }

    $cmt = "CRM-заказ #$($o.id)"
    if ($o.client_name) { $cmt += " | $($o.client_name)" }
    if ($o.phone)       { $cmt += " | тел: $($o.phone)" }
    if ($o.note)        { $cmt += " | $($o.note)" }
    [void]$C.InvokeMember('Комментарий',$set,$null,$doc,@($cmt))

    $zap = $C.InvokeMember('Запасы',$get,$null,$doc,$null)
    $cnt = 0
    foreach ($it in @($o.items)) {
      if (-not $it.ref) { continue }
      $row  = $C.InvokeMember('Добавить',$inv,$null,$zap,@())
      $gn   = $C.InvokeMember('NewObject',$inv,$null,$ib,@('УникальныйИдентификатор',[string]$it.ref))
      $nref = $C.InvokeMember('ПолучитьСсылку',$inv,$null,$nomCat,@($gn))
      [void]$C.InvokeMember('Номенклатура',$set,$null,$row,@($nref))
      $qty = [double][Math]::Max(1,[int]$it.qty)
      $prc = [double]$it.price
      [void]$C.InvokeMember('Количество',$set,$null,$row,@($qty))
      [void]$C.InvokeMember('Цена',$set,$null,$row,@($prc))
      [void]$C.InvokeMember('Сумма',$set,$null,$row,@([double]($qty*$prc)))
      $cnt++
    }

    [void]$C.InvokeMember('Записать',$inv,$null,$doc,@())
    $num = [string]$C.InvokeMember('Номер',$get,$null,$doc,$null)
    Log "OK заказ $($o.id) -> 1С № $num (строк: $cnt)"
    $results += @{ id = $o.id; ok = $true; number = $num }
  } catch {
    Log "ERR заказ $($o.id): $($_.Exception.Message)"
    $results += @{ id = $o.id; ok = $false; error = $_.Exception.Message }
  }
}

# === Клиенты CRM -> Контрагенты 1С ===
$ktrCat = $C.InvokeMember('Контрагенты',$get,$null,$cats,$null)
foreach ($cl in @($obx.clients)) {
  try {
    if ($cl.ref) {
      # обновление существующего контрагента (правка из CRM: имя/телефон)
      $uuidObj = $C.InvokeMember('NewObject',$inv,$null,$ib,@('УникальныйИдентификатор',[string]$cl.ref))
      $erefU = $C.InvokeMember('ПолучитьСсылку',$inv,$null,$ktrCat,@($uuidObj))
      $objU = $C.InvokeMember('ПолучитьОбъект',$inv,$null,$erefU,@())
      if ($objU) {
        if ($cl.name)  { [void]$C.InvokeMember('Наименование',$set,$null,$objU,@([string]$cl.name)); [void]$C.InvokeMember('НаименованиеПолное',$set,$null,$objU,@([string]$cl.name)) }
        if ($cl.phone) { [void]$C.InvokeMember('НомерТелефонаДляПоиска',$set,$null,$objU,@([string]$cl.phone)) }
        if ($cl.inn) { [void]$C.InvokeMember('ИНН',$set,$null,$objU,@([string]$cl.inn)) }
        if ($cl.dob) { try { $bd=[datetime]::ParseExact([string]$cl.dob,'yyyy-MM-dd',$null); [void]$C.InvokeMember('ДатаРождения',$set,$null,$objU,@($bd)) } catch {} }
        [void]$C.InvokeMember('Записать',$inv,$null,$objU,@())
        Log "OK обновлён контрагент $($cl.ref) (правка из CRM)"
        $results += @{ kind='client'; id=$cl.id; ok=$true; ref=[string]$cl.ref }
        continue
      }
    }
    $qc = $C.InvokeMember('NewObject',$inv,$null,$ib,@('Запрос'))
    [void]$C.InvokeMember('Текст',$set,$null,$qc,@('ВЫБРАТЬ ПЕРВЫЕ 1 Контрагенты.Ссылка КАК Ссылка ИЗ Справочник.Контрагенты КАК Контрагенты ГДЕ Контрагенты.Комментарий ПОДОБНО &Шаблон'))
    [void]$C.InvokeMember('УстановитьПараметр',$inv,$null,$qc,@('Шаблон',"%CRM-клиент #$($cl.id)%"))
    $selc = $C.InvokeMember('Выбрать',$inv,$null,($C.InvokeMember('Выполнить',$inv,$null,$qc,@())),@())
    if ($C.InvokeMember('Следующий',$inv,$null,$selc,@())) {
      $eref = $C.InvokeMember('Ссылка',$get,$null,$selc,$null)
      $euid = $C.InvokeMember('УникальныйИдентификатор',$inv,$null,$eref,@())
      $erefStr = [string]$C.InvokeMember('String',$inv,$null,$ib,@($euid))
      Log "SKIP клиент $($cl.id) — уже в 1С (дубль предотвращён)"
      $results += @{ kind='client'; id=$cl.id; ok=$true; ref=$erefStr }
      continue
    }
    $obj = $C.InvokeMember('СоздатьЭлемент',$inv,$null,$ktrCat,@())
    [void]$C.InvokeMember('Наименование',$set,$null,$obj,@([string]$cl.name))
    [void]$C.InvokeMember('НаименованиеПолное',$set,$null,$obj,@([string]$cl.name))
    if ($cl.phone) { [void]$C.InvokeMember('НомерТелефонаДляПоиска',$set,$null,$obj,@([string]$cl.phone)) }
    if ($cl.inn) { [void]$C.InvokeMember('ИНН',$set,$null,$obj,@([string]$cl.inn)) }
    if ($cl.dob) { try { $bd=[datetime]::ParseExact([string]$cl.dob,'yyyy-MM-dd',$null); [void]$C.InvokeMember('ДатаРождения',$set,$null,$obj,@($bd)) } catch {} }
    [void]$C.InvokeMember('Покупатель',$set,$null,$obj,@($true))
    $cmtc = "CRM-клиент #$($cl.id)"; if ($cl.source) { $cmtc += " | источник: $($cl.source)" }
    [void]$C.InvokeMember('Комментарий',$set,$null,$obj,@($cmtc))
    [void]$C.InvokeMember('Записать',$inv,$null,$obj,@())
    $ref = $C.InvokeMember('Ссылка',$get,$null,$obj,$null)
    $uid = $C.InvokeMember('УникальныйИдентификатор',$inv,$null,$ref,@())
    $refStr = [string]$C.InvokeMember('String',$inv,$null,$ib,@($uid))
    Log "OK клиент $($cl.id) -> Контрагент ($refStr)"
    $results += @{ kind='client'; id=$cl.id; ok=$true; ref=$refStr }
  } catch {
    Log "ERR клиент $($cl.id): $($_.Exception.Message)"
    $results += @{ kind='client'; id=$cl.id; ok=$false; error=$_.Exception.Message }
  }
}

# === Промокоды CRM -> Дисконтные карты 1С ===
$dkCat  = $C.InvokeMember('ДисконтныеКарты',$get,$null,$cats,$null)
$vidCat = $C.InvokeMember('ВидыДисконтныхКарт',$get,$null,$cats,$null)
foreach ($pm in @($obx.promos)) {
  try {
    if (-not $pm.type_key) { Log "SKIP промокод $($pm.id) — не указан вид карты"; $results += @{ kind='promo'; id=$pm.id; ok=$false; error='не указан вид карты 1С' }; continue }
    $qp = $C.InvokeMember('NewObject',$inv,$null,$ib,@('Запрос'))
    [void]$C.InvokeMember('Текст',$set,$null,$qp,@('ВЫБРАТЬ ПЕРВЫЕ 1 ДисконтныеКарты.Ссылка КАК Ссылка ИЗ Справочник.ДисконтныеКарты КАК ДисконтныеКарты ГДЕ ДисконтныеКарты.КодКартыШтрихкод = &Код'))
    [void]$C.InvokeMember('УстановитьПараметр',$inv,$null,$qp,@('Код',[string]$pm.code))
    $selp = $C.InvokeMember('Выбрать',$inv,$null,($C.InvokeMember('Выполнить',$inv,$null,$qp,@())),@())
    if ($C.InvokeMember('Следующий',$inv,$null,$selp,@())) {
      $pref = $C.InvokeMember('Ссылка',$get,$null,$selp,$null)
      $puid = $C.InvokeMember('УникальныйИдентификатор',$inv,$null,$pref,@())
      $prefStr = [string]$C.InvokeMember('String',$inv,$null,$ib,@($puid))
      Log "SKIP промокод $($pm.code) — уже есть в 1С"
      $results += @{ kind='promo'; id=$pm.id; ok=$true; ref=$prefStr }; continue
    }
    $gv = $C.InvokeMember('NewObject',$inv,$null,$ib,@('УникальныйИдентификатор',[string]$pm.type_key))
    $vidRef = $C.InvokeMember('ПолучитьСсылку',$inv,$null,$vidCat,@($gv))
    $obj = $C.InvokeMember('СоздатьЭлемент',$inv,$null,$dkCat,@())
    [void]$C.InvokeMember('Владелец',$set,$null,$obj,@($vidRef))
    [void]$C.InvokeMember('Наименование',$set,$null,$obj,@([string]$pm.code))
    [void]$C.InvokeMember('КодКартыШтрихкод',$set,$null,$obj,@([string]$pm.code))
    [void]$C.InvokeMember('Записать',$inv,$null,$obj,@())
    $ref = $C.InvokeMember('Ссылка',$get,$null,$obj,$null)
    $uid = $C.InvokeMember('УникальныйИдентификатор',$inv,$null,$ref,@())
    $refStr = [string]$C.InvokeMember('String',$inv,$null,$ib,@($uid))
    Log "OK промокод $($pm.code) -> Дисконтная карта ($refStr)"
    $results += @{ kind='promo'; id=$pm.id; ok=$true; ref=$refStr }
  } catch {
    Log "ERR промокод $($pm.id): $($_.Exception.Message)"
    $results += @{ kind='promo'; id=$pm.id; ok=$false; error=$_.Exception.Message }
  }
}

# 3) репорт результата обратно в воркер (ack)
$body  = @{ results = $results } | ConvertTo-Json -Depth 6 -Compress
$bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
try { $ack = Invoke-RestMethod -Uri ($cfg.workerUrl + '/api/sync/1c/outbox/ack') -Headers $ackHdr -Method POST -Body $bytes; Log "ack: применено $($ack.applied), ошибок $($ack.failed)" }
catch { Log "ОШИБКА ack: $($_.Exception.Message)" }
Log "===== Push-Orders готово ====="
