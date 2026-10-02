/* Synthetic DWG2018 attributes and FIELD values. No customer drawing data.
   Link with the corresponding patched LibreDWG archive, as other native tests. */
#include "pllato_executive_engine.c"
#include <assert.h>
#include <unistd.h>
size_t pllato_encoded_payload_end;

int main(int argc, char **argv) {
  assert(argc == 3 && access(argv[2], F_OK) != 0);
  assert(pllato_open(argv[1]) < 128);
  Dwg_Data *d = &drawing;
  /* GNU's convenience constructor leaves the R2018 type at zero. */
  for (unsigned i = 0; i < d->num_objects; i++)
    if (d->object[i].fixedtype == DWG_TYPE_ATTRIB)
      d->object[i].tio.entity->tio.ATTRIB->mtext_type = 1;
  BITCODE_HV definition = 0;
  for (unsigned i = 0; i < d->num_objects; i++) {
    Dwg_Object *o = &d->object[i];
    if (o->fixedtype != DWG_TYPE_ATTDEF) continue;
    definition = o->handle.value;
    Dwg_Entity_ATTDEF *a = o->tio.entity->tio.ATTDEF;
    a->mtext_type = 4;
    a->mtext.entmode = 0;
    a->mtext.ownerhandle = dwg_add_handleref(d, 4, 0, NULL);
    a->mtext.is_xdic_missing = 1;
    a->mtext.layer = o->tio.entity->layer;
    a->mtext.style = a->style;
    a->mtext.color.raw = 256;
    a->mtext.ltype_scale = 1;
    a->mtext.extrusion.z = 1;
    a->mtext.x_axis_dir.x = 1;
    a->mtext.rect_width = 100;
    a->mtext.text_height = 5;
    a->mtext.attachment = 1;
    a->mtext.flow_dir = 1;
    a->mtext.text = (BITCODE_T)bit_utf8_to_TU("Two lines\\PSecond line", 0);
    a->mtext.linespace_style = 1;
    a->mtext.linespace_factor = 1;
    a->mtext.is_not_annotative = 1;
    a->mtext.class_version = 0;
    a->mtext.default_flag = 1;
    a->mtext.appid = dwg_add_handleref(d, 5, 0, NULL);
    a->flags = 12;
    a->lock_position_flag = 1;
    break;
  }
  assert(definition);
  Dwg_Object_DICTIONARY *dict = dwg_add_DICTIONARY(d, "PLL_FIELD_TEST", NULL, 0);
  assert(dict);
  int err = 0;
  BITCODE_HV owner = dwg_obj_generic_to_object(dict, &err)->handle.value;
  unsigned index = d->num_objects;
  BITCODE_HV handle = dwg_next_handle(d);
  assert(dwg_add_object(d) >= -1);
  Dwg_Object *o = &d->object[index];
  assert(!dwg_setup_FIELD(o));
  o->type = dwg_add_class(d, "FIELD", "AcDbField", "ObjectDBX Classes", false);
  assert(o->type >= 500);
  dwg_add_handle(&o->handle, 0, handle, o);
  hash_set(d->object_map, handle, index);
  o->tio.object->is_xdic_missing = 1;
  o->tio.object->ownerhandle = dwg_add_handleref(d, 4, owner, NULL);
  assert(dwg_add_DICTIONARY_item(dict, "VALUE", handle));
  Dwg_Object_FIELD *f = o->tio.object->tio.FIELD;
  f->id = (BITCODE_T)bit_utf8_to_TU("AcVar", 0);
  f->code = (BITCODE_T)bit_utf8_to_TU("\\AcVar Filename", 0);
  f->evaluation_option = 63;
  f->value.format_flags = 4;
  f->value.data_type = 4;
  f->value.data_string = (BITCODE_T)bit_utf8_to_TU("Example.dwg", 0);
  f->value.data_size = (strlen("Example.dwg") + 1) * 2;
  f->num_childval = 4;
  f->childval = calloc(4, sizeof(*f->childval));
  for (unsigned i = 0; i < 4; i++) {
    char name[16]; snprintf(name, sizeof(name), "FLAGS_%u", i);
    f->childval[i].parent = f;
    f->childval[i].key = (BITCODE_T)bit_utf8_to_TU(name, 0);
    f->childval[i].value.format_flags = i;
    f->childval[i].value.data_type = 2;
    f->childval[i].value.data_double = (i & 1) ? 0 : 123.25 + i;
  }
  assert(pllato_save(argv[2]) < 128);
  pllato_close(); assert(pllato_open(argv[2]) < 128);
  o = dwg_resolve_handle(&drawing, definition);
  Dwg_Entity_ATTDEF *a = o->tio.entity->tio.ATTDEF;
  assert(a->mtext_type == 4 && a->flags == 12 && a->lock_position_flag == 1);
  assert(a->mtext.is_not_annotative && a->mtext.default_flag);
  assert(a->style && a->mtext.style && a->style->absolute_ref == a->mtext.style->absolute_ref);
  f = dwg_resolve_handle(&drawing, handle)->tio.object->tio.FIELD;
  assert(f->num_childval == 4 && f->value.data_size == 24);
  char *text = bit_convert_TU((BITCODE_TU)f->value.data_string);
  assert(!strcmp(text, "Example.dwg")); free(text);
  for (unsigned i = 0; i < 4; i++) {
    assert(f->childval[i].value.format_flags == i);
    assert(f->childval[i].value.data_double == ((i & 1) ? 0 : 123.25 + i));
  }
  pllato_close();
  puts("PASS multiline ATTDEF, single ATTRIB, FIELD flags and inline Unicode string");
  return 0;
}
