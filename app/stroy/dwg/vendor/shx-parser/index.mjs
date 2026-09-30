class w {
  /**
   * Converts an unsigned byte to a signed byte as used in SHX format.
   * Values > 127 are converted to their signed equivalent (-128 to -1).
   * @param value - The unsigned byte value to convert
   * @returns The signed byte value
   */
  static byteToSByte(t) {
    return (t & 127) - (t & 128 ? 128 : 0);
  }
  /**
   * Creates a new ShxFileReader instance.
   * @param arraybuffer - The ArrayBuffer to read from
   */
  constructor(t) {
    this.position = 0, this.data = new DataView(t);
  }
  /**
   * Reads a specified number of bytes from the current position.
   * @param length - Number of bytes to read (optional)
   * @returns A Uint8Array containing the read bytes
   * @throws Error if reading beyond buffer bounds
   */
  readBytes(t = 1) {
    this.data.byteLength < this.position + t && this.throwOutOfRangeError(this.position + t);
    const e = new Uint8Array(this.data.buffer, this.position, t);
    return this.position += t, e;
  }
  /**
   * Skips a specified number of bytes from the current position.
   * @param length - Number of bytes to skip
   * @throws Error if skipping beyond buffer bounds
   */
  skip(t) {
    this.data.byteLength < this.position + t && this.throwOutOfRangeError(this.position + t), this.position += t;
  }
  /**
   * Reads an unsigned 8-bit integer.
   * @returns The read uint8 value
   * @throws Error if reading beyond buffer bounds
   */
  readUint8() {
    this.data.byteLength < this.position + 1 && this.throwOutOfRangeError(this.position + 1);
    const t = this.data.getUint8(this.position);
    return this.position += 1, t;
  }
  /**
   * Reads a signed 8-bit integer.
   * @returns The read int8 value
   * @throws Error if reading beyond buffer bounds
   */
  readInt8() {
    this.data.byteLength < this.position + 1 && this.throwOutOfRangeError(this.position + 1);
    const t = this.data.getInt8(this.position);
    return this.position += 1, t;
  }
  /**
   * Reads an unsigned 16-bit integer.
   * @param littleEndian If false, a big-endian value should be read.
   * @returns The read uint16 value
   * @throws Error if reading beyond buffer bounds
   */
  readUint16(t = !0) {
    this.data.byteLength < this.position + 2 && this.throwOutOfRangeError(this.position + 2);
    const e = this.data.getUint16(this.position, t);
    return this.position += 2, e;
  }
  /**
   * Reads a signed 16-bit integer.
   * @returns The read int16 value
   * @throws Error if reading beyond buffer bounds
   */
  readInt16() {
    this.data.byteLength < this.position + 2 && this.throwOutOfRangeError(this.position + 2);
    const t = this.data.getInt16(this.position, !0);
    return this.position += 2, t;
  }
  /**
   * Reads an unsigned 32-bit integer.
   * @returns The read uint32 value
   * @throws Error if reading beyond buffer bounds
   */
  readUint32() {
    this.data.byteLength < this.position + 4 && this.throwOutOfRangeError(this.position + 4);
    const t = this.data.getUint32(this.position, !0);
    return this.position += 4, t;
  }
  /**
   * Reads a signed 32-bit integer.
   * @returns The read int32 value
   * @throws Error if reading beyond buffer bounds
   */
  readInt32() {
    this.data.byteLength < this.position + 4 && this.throwOutOfRangeError(this.position + 4);
    const t = this.data.getInt32(this.position, !0);
    return this.position += 4, t;
  }
  /**
   * Reads a 32-bit floating point number.
   * @returns The read float32 value
   * @throws Error if reading beyond buffer bounds
   */
  readFloat32() {
    this.data.byteLength < this.position + 4 && this.throwOutOfRangeError(this.position + 4);
    const t = this.data.getFloat32(this.position, !0);
    return this.position += 4, t;
  }
  /**
   * Reads a 64-bit floating point number.
   * @returns The read float64 value
   * @throws Error if reading beyond buffer bounds
   */
  readFloat64() {
    this.data.byteLength < this.position + 8 && this.throwOutOfRangeError(this.position + 8);
    const t = this.data.getFloat64(this.position, !0);
    return this.position += 8, t;
  }
  /**
   * Sets the current read position in the buffer.
   * @param position - The new position to set
   */
  setPosition(t) {
    this.data.byteLength < t && this.throwOutOfRangeError(t), this.position = t;
  }
  /**
   * Checks if the current position is at the end of the buffer.
   * @returns True if at the end of the buffer, false otherwise
   */
  isEnd() {
    return this.position === this.data.byteLength - 1;
  }
  /**
   * Gets the current position in the buffer.
   * @returns The current position
   */
  get currentPosition() {
    return this.position;
  }
  /**
   * Gets the total length of the buffer.
   * @returns The buffer length in bytes
   */
  get length() {
    return this.data.byteLength;
  }
  /**
   * Throws an error when attempting to read beyond buffer bounds.
   * @param position - The position that caused the error
   * @throws Error with details about the out of range access
   */
  throwOutOfRangeError(t) {
    throw new Error(
      `Position ${t} is out of range for the data length ${this.data.byteLength}!`
    );
  }
}
var d = /* @__PURE__ */ ((c) => (c.SHAPES = "shapes", c.BIGFONT = "bigfont", c.UNIFONT = "unifont", c))(d || {});
class z {
  parse(t) {
    const n = this.parseHeader(t).split(" "), i = n[1].toLocaleLowerCase();
    if (!Object.values(d).includes(i))
      throw new Error(`Invalid font type: ${i}`);
    return {
      fileHeader: n[0],
      fontType: i,
      fileVersion: n[2]
    };
  }
  parseHeader(t) {
    let e = "", i = 0;
    for (; t.currentPosition < t.length - 2 && i < 1024; ) {
      const s = t.readUint8();
      if (s === 13) {
        const o = t.currentPosition, r = t.readUint8(), h = t.readUint8();
        if (r === 10 && h === 26)
          break;
        t.setPosition(o), e += String.fromCharCode(s);
      } else
        e += String.fromCharCode(s);
      i++;
    }
    return e.trim();
  }
}
const O = 10, j = [13, 10, 0];
function U(c, t) {
  if (t === 0) {
    c.orientation = "horizontal";
    return;
  }
  if (t === 2) {
    c.orientation = "horizontal", c.dualOrientation = !0;
    return;
  }
  c.orientation = "vertical";
}
function $(c) {
  const t = {};
  for (const [e, n] of Object.entries(c))
    t[n] = e;
  return t;
}
function H(c) {
  const t = c.indexOf(0);
  return t < 0 ? { name: null, bytecode: c } : { name: t > 0 ? new TextDecoder("ascii").decode(c.subarray(0, t)) : null, bytecode: c.subarray(t + 1) };
}
class K {
  parse(t) {
    try {
      t.readBytes(4);
      const e = t.readInt16();
      if (e <= 0)
        throw new Error("Invalid shape count in font file");
      const n = [];
      for (let h = 0; h < e; h++) {
        const a = t.readUint16(), l = t.readUint16();
        l > 0 && n.push({ code: a, length: l });
      }
      const i = {};
      for (const h of n)
        try {
          const a = t.readBytes(h.length);
          a.length === h.length && (i[h.code] = a);
        } catch {
          console.warn(`Failed to read shape data for code ${h.code}`);
        }
      const s = {}, o = {};
      for (const [h, a] of Object.entries(i)) {
        const l = Number(h);
        if (l === 0) {
          s[l] = a;
          continue;
        }
        const { name: u, bytecode: p } = H(a);
        s[l] = p, u && (o[u] = l);
      }
      const r = {
        data: s,
        names: Object.keys(o).length > 0 ? o : void 0,
        codeToName: Object.keys(o).length > 0 ? $(o) : void 0,
        info: "",
        baseUp: 8,
        baseDown: 2,
        height: O,
        width: O,
        orientation: "horizontal",
        isExtended: !1
      };
      if (0 in s) {
        const h = s[0];
        try {
          const a = new TextDecoder().decode(h);
          let l = h.findIndex((u) => j.includes(u));
          l >= 0 && (r.info = a.substring(0, l), l + 3 < h.length && (r.baseUp = h[l + 1], r.baseDown = h[l + 2], r.height = r.baseDown + r.baseUp, r.width = r.height, U(r, h[l + 3])));
        } catch {
          console.warn("Failed to parse font info block");
        }
      }
      return r;
    } catch (e) {
      const n = e instanceof Error ? e.message : String(e);
      throw new Error(`Failed to parse shape font: ${n}`);
    }
  }
}
class q {
  parse(t) {
    try {
      t.readInt16();
      const e = t.readInt16(), n = t.readInt16();
      if (e <= 0)
        throw new Error("Invalid character count in font file");
      t.skip(n * 4);
      const i = [];
      for (let r = 0; r < e; r++) {
        const h = t.readUint16(), a = t.readUint16(), l = t.readUint32();
        (h !== 0 || a !== 0 || l !== 0) && i.push({ code: h, length: a, offset: l });
      }
      const s = {};
      for (const r of i)
        try {
          t.setPosition(r.offset);
          const h = t.readBytes(r.length);
          h.length === r.length && (s[r.code] = h);
        } catch {
          console.warn(`Failed to read bigfont data for code ${r.code}`);
        }
      const o = {
        data: s,
        info: "",
        baseUp: 8,
        baseDown: 2,
        height: O,
        width: O,
        orientation: "horizontal",
        isExtended: !1
      };
      if (0 in s) {
        const r = s[0];
        try {
          const h = this.utf8ArrayToStr(r);
          if (h.pos >= 0) {
            let a = h.text;
            for (; a.length > 0 && a.charCodeAt(a.length - 1) === 0; )
              a = a.slice(0, -1);
            o.info = a;
            const l = this.parseBigfontMetrics(r, h.pos + 1);
            l && Object.assign(o, l);
          }
        } catch {
          console.warn("Failed to parse bigfont info block");
        }
      }
      return o;
    } catch (e) {
      const n = e instanceof Error ? e.message : String(e);
      throw new Error(`Failed to parse big font: ${n}`);
    }
  }
  parseBigfontMetrics(t, e) {
    let n = e;
    for (; n < t.length && t[n] === 0; )
      n++;
    const i = t.length - n;
    if (i <= 0)
      return null;
    const s = (o) => o === 0 ? "horizontal" : "vertical";
    if (i >= 5) {
      const o = t[n++];
      n++;
      const r = s(t[n++]), h = t[n++];
      return {
        baseUp: o,
        baseDown: 0,
        height: o,
        width: h,
        orientation: r,
        isExtended: !0
      };
    }
    if (i === 4 && t[n + 1] === 0 && t[n + 3] > 0 && t[n + 3] !== t[n]) {
      const o = t[n++];
      n++;
      const r = s(t[n++]), h = t[n];
      return {
        baseUp: o,
        baseDown: 0,
        height: o,
        width: h,
        orientation: r,
        isExtended: !0
      };
    }
    if (i === 4) {
      const o = t[n++], r = t[n++], h = s(t[n++]);
      return {
        baseUp: o,
        baseDown: r,
        height: o + r,
        width: o + r,
        orientation: h,
        isExtended: !1
      };
    }
    if (i === 3) {
      const o = t[n++], r = t[n++], h = s(r), a = r === 2;
      return {
        baseUp: o,
        baseDown: 0,
        height: o,
        width: o,
        orientation: h,
        // Dual-orientation vertical bigfonts (modes=2) use composite bytecode.
        isExtended: a,
        verticalDualMode: a
      };
    }
    return null;
  }
  utf8ArrayToStr(t) {
    let e = "", n = 0;
    for (; n < t.length; ) {
      const i = t[n];
      switch (i >> 4) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
          e += String.fromCharCode(i);
          break;
        case 12:
        case 13: {
          const s = t[n++];
          e += String.fromCharCode((i & 31) << 6 | s & 63);
          break;
        }
        case 14: {
          const s = t[n++], o = t[n++];
          e += String.fromCharCode(
            (i & 15) << 12 | (s & 63) << 6 | (o & 63) << 0
          );
          break;
        }
      }
      if (e.charCodeAt(e.length - 1) === 0) break;
      n++;
    }
    return { text: e, pos: n };
  }
}
class Z {
  parse(t) {
    try {
      const e = t.readInt32();
      if (e <= 0)
        throw new Error("Invalid character count in font file");
      const n = t.readInt16(), i = t.readBytes(n), s = {
        data: {},
        info: "",
        baseUp: 8,
        baseDown: 2,
        height: O,
        width: O,
        orientation: "horizontal",
        isExtended: !1
      };
      try {
        const h = new TextDecoder().decode(i);
        let a = h.indexOf("\0");
        a >= 0 && (s.info = h.substring(0, a), a + 3 < i.length && (s.baseUp = i[a + 1], s.baseDown = i[a + 2], s.height = s.baseUp + s.baseDown, s.width = s.height, U(s, i[a + 3])));
      } catch {
        console.warn("Failed to parse unifont info block");
      }
      const o = {}, r = {};
      for (let h = 0; h < e - 1; h++)
        try {
          const a = t.readUint16(), l = t.readUint16();
          if (l > 0) {
            const u = t.readBytes(l);
            if (u.length === l) {
              const { name: p, bytecode: g } = H(u);
              g.length > 0 && (o[a] = g, p && (r[p] = a));
            }
          }
        } catch {
          console.warn("Failed to read unifont character data");
          break;
        }
      return s.data = o, s.names = Object.keys(r).length > 0 ? r : void 0, s.codeToName = Object.keys(r).length > 0 ? $(r) : void 0, s;
    } catch (e) {
      const n = e instanceof Error ? e.message : String(e);
      throw new Error(`Failed to parse unifont: ${n}`);
    }
  }
}
class J {
  static createParser(t) {
    switch (t) {
      case d.SHAPES:
        return new K();
      case d.BIGFONT:
        return new q();
      case d.UNIFONT:
        return new Z();
      default:
        throw new Error(`Unsupported font type: ${t}`);
    }
  }
}
const Q = 1e-6, D = 0.2;
class L {
  /**
   * Whether the aligned glyph should store the resolved advance as explicit.
   * When false, {@link ShxShape.hasExplicitAdvance} is preserved from the source glyph.
   */
  markAlignedAdvanceExplicit(t) {
    return !1;
  }
}
class mt extends L {
  resolve(t, e) {
    var s;
    const n = ((s = t.lastPoint) == null ? void 0 : s.x) ?? 0, i = t.polylines.some((o) => o.length >= 2);
    return t.hasExplicitAdvance || !i && Math.abs(n) > Q ? n : e;
  }
}
class M extends L {
  constructor(t = D) {
    super(), this.cellWidthFactor = t;
  }
  /**
   * True when ink extends left of the glyph origin (UNIFONT center-cell encoding).
   */
  static isCenterOriginGlyph(t) {
    return t.bbox.minX < -1e-6;
  }
  /**
   * Resolves ink-based advance for a glyph at a scaled cell width.
   *
   * Left-origin glyphs (`minX >= 0`): `maxX + cellWidth * factor`.
   * Center-origin glyphs (`minX < 0`): advance to the right cell edge
   * (`max(maxX, cellWidth / 2)`) plus padding, so narrow centered punctuation
   * keeps trailing whitespace instead of colliding with the next glyph.
   */
  static computeAdvance(t, e, n = D) {
    if (!t.polylines.some((r) => r.length >= 2))
      return e * n;
    const s = e * n, { maxX: o } = t.bbox;
    return M.isCenterOriginGlyph(t) ? Math.max(o, e / 2) + s : o + s;
  }
  resolve(t, e) {
    var n;
    return t.hasExplicitAdvance ? ((n = t.lastPoint) == null ? void 0 : n.x) ?? 0 : M.computeAdvance(t, e, this.cellWidthFactor);
  }
  markAlignedAdvanceExplicit(t) {
    return !0;
  }
}
const E = new M();
class f {
  /**
   * Creates a new Point instance.
   * @param x - The x-coordinate (defaults to 0)
   * @param y - The y-coordinate (defaults to 0)
   */
  constructor(t = 0, e = 0) {
    this.x = t, this.y = e;
  }
  /**
   * Sets the coordinates of the point.
   * @param x - The new x-coordinate
   * @param y - The new y-coordinate
   * @returns The point instance for method chaining
   */
  set(t, e) {
    return this.x = t, this.y = e, this;
  }
  /**
   * Calculates the length (magnitude) of the vector from origin to this point.
   * @returns The length of the vector
   */
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  /**
   * Normalizes the point vector to have a length of 1.
   * @returns The point instance for method chaining
   */
  normalize() {
    const t = this.length();
    return t !== 0 && (this.x /= t, this.y /= t), this;
  }
  /**
   * Creates a new Point instance with the same coordinates.
   * @returns A new Point instance with the same x and y values
   */
  clone() {
    return new f(this.x, this.y);
  }
  /**
   * Adds another point's coordinates to this point.
   * @param point - The point to add
   * @returns The point instance for method chaining
   */
  add(t) {
    return this.x += t.x, this.y += t.y, this;
  }
  /**
   * Subtracts another point's coordinates from this point.
   * @param point - The point to subtract
   * @returns The point instance for method chaining
   */
  subtract(t) {
    return this.x -= t.x, this.y -= t.y, this;
  }
  /**
   * Multiplies both coordinates by a scalar value.
   * @param scalar - The scalar value to multiply by
   * @returns The point instance for method chaining
   */
  multiply(t) {
    return this.x *= t, this.y *= t, this;
  }
  /**
   * Divides both coordinates by a scalar value.
   * @param scalar - The scalar value to divide by
   * @returns The point instance for method chaining
   */
  divide(t) {
    return t !== 0 && (this.x /= t, this.y /= t), this;
  }
  /**
   * Multiplies x and y coordinates by different scalar values.
   * @param xScalar - The scalar value to multiply x-coordinate by
   * @param yScalar - The scalar value to multiply y-coordinate by
   * @returns The point instance for method chaining
   */
  multiplyScalars(t, e) {
    return this.x *= t, this.y *= e, this;
  }
  /**
   * Divides x and y coordinates by different scalar values.
   * @param xScalar - The scalar value to divide x-coordinate by
   * @param yScalar - The scalar value to divide y-coordinate by
   * @returns The point instance for method chaining
   */
  divideScalars(t, e) {
    return t !== 0 && (this.x /= t), e !== 0 && (this.y /= e), this;
  }
  /**
   * Calculates the Euclidean distance to another point.
   * @param point - The point to calculate distance to
   * @returns The distance between the two points
   */
  distanceTo(t) {
    const e = this.x - t.x, n = this.y - t.y;
    return Math.sqrt(e * e + n * n);
  }
}
function _(c) {
  const { width: t, capHeight: e, descenderHeight: n, origin: i = "baseline" } = c, s = e + n;
  return i === "top" ? { minX: -t / 2, maxX: t / 2, minY: -s, maxY: 0 } : { minX: 0, maxX: t, minY: -n, maxY: e };
}
function tt(c) {
  return [c.minX, c.minY, c.maxX, c.maxY].every(Number.isFinite);
}
function et(c, t, e = 1e-6) {
  return t.minX >= c.minX - e && t.maxX <= c.maxX + e && t.minY >= c.minY - e && t.maxY <= c.maxY + e;
}
function nt(c, t) {
  return {
    minX: Math.min(c.minX, t.minX),
    minY: Math.min(c.minY, t.minY),
    maxX: Math.max(c.maxX, t.maxX),
    maxY: Math.max(c.maxY, t.maxY)
  };
}
function it(c, t, e) {
  const n = c.maxX - c.minX, i = c.maxY - c.minY;
  return `<rect x="${c.minX}" y="${-c.maxY}" width="${n}" height="${i}" fill="none" stroke="${t}" stroke-width="${e}"/>`;
}
function F(c, t) {
  const e = c.maxX - c.minX, n = c.maxY - c.minY;
  return `<rect x="${c.minX}" y="${-c.maxY}" width="${e}" height="${n}" fill="${t}"/>`;
}
function st(c, t, e, n, i, s, o) {
  const r = ` stroke-dasharray="${o}"`;
  return `<line x1="${c}" y1="${-t}" x2="${e}" y2="${-n}" stroke="${i}" stroke-width="${s}"${r}/>`;
}
function ot(c, t, e) {
  const { capHeight: n, descenderHeight: i, origin: s = "baseline" } = c, o = n + i, r = _(c);
  let h, a, l;
  s === "top" ? (n > 0 && (h = { minX: r.minX, maxX: r.maxX, minY: -n, maxY: 0 }), i > 0 && (a = {
    minX: r.minX,
    maxX: r.maxX,
    minY: -o,
    maxY: -n
  }), l = -n) : (n > 0 && (h = { minX: r.minX, maxX: r.maxX, minY: 0, maxY: n }), i > 0 && (a = {
    minX: r.minX,
    maxX: r.maxX,
    minY: -i,
    maxY: 0
  }), l = 0);
  const g = [
    h ? F(h, "rgba(255, 0, 0, 0.06)") : "",
    a ? F(a, "rgba(255, 0, 0, 0.14)") : "",
    it(r, t, e)
  ];
  return l !== void 0 && i > 0 && n > 0 && g.push(
    st(
      r.minX,
      l,
      r.maxX,
      l,
      t,
      e,
      "4 2"
    )
  ), `<g>${g.join("")}</g>`;
}
class v {
  constructor(t, e = [], n = !1) {
    this.lastPoint = t, this.polylines = e, this.hasExplicitAdvance = n;
  }
  /**
   * Get the bounding box of the shape
   * @returns Bounding box of the shape
   */
  get bbox() {
    if (this._bbox)
      return this._bbox;
    let t = 1 / 0, e = -1 / 0, n = 1 / 0, i = -1 / 0;
    return this.polylines.forEach((s) => {
      s.forEach((o) => {
        t = Math.min(t, o.x), e = Math.max(e, o.x), n = Math.min(n, o.y), i = Math.max(i, o.y);
      });
    }), this._bbox = { minX: t, minY: n, maxX: e, maxY: i }, this._bbox;
  }
  /**
   * Offset the shape by a point
   * @param p The point to offset the shape by
   * @param isNewInstance Whether to return a new instance of the shape or modify the current instance
   * @returns The offset shape
   */
  offset(t, e = !0) {
    var n, i;
    return e ? new v(
      (n = this.lastPoint) == null ? void 0 : n.clone().add(t),
      this.polylines.map((s) => s.map((o) => o.clone().add(t))),
      this.hasExplicitAdvance
    ) : ((i = this.lastPoint) == null || i.add(t), this.polylines.forEach((s) => s.forEach((o) => o.add(t))), this._bbox && (this._bbox.maxX += t.x, this._bbox.minX += t.x, this._bbox.maxY += t.y, this._bbox.minY += t.y), this);
  }
  /**
   * Normalizes a shape so that its bounding box’s bottom-left corner moves to the origin (0,0).
   * It doesn’t change the size or orientation, only repositions the shape.
   * @param isNewInstance Whether to return a new instance of the shape or modify the current instance
   * @returns The offset shape
   */
  normalizeToOrigin(t = !1) {
    const e = this.bbox;
    return this.offset(new f(-e.minX, -e.minY), t);
  }
  /**
   * Converts the shape to an SVG string
   * @param options SVG rendering options
   * @returns SVG string
   */
  toSVG(t = {}) {
    const {
      strokeWidth: e = "0.5%",
      strokeColor: n = "black",
      isAutoFit: i = !1,
      fontCell: s
    } = t;
    let o, r;
    const h = (a) => this.polylines.map((l) => {
      let u = "";
      return l.forEach((p, g) => {
        const { x: y, y: b } = a(p);
        u += g === 0 ? `M ${y} ${b} ` : `L ${y} ${b} `;
      }), `<path d="${u}" stroke="${n}" stroke-width="${e}" fill="none"/>`;
    }).join("");
    if (s) {
      const {
        padding: a = 0.1,
        expandToFit: l = !1,
        showFrame: u = !1,
        frameColor: p = "red",
        frameStrokeWidth: g = "0.5%"
      } = s, y = _(s), b = this.bbox;
      let m = y;
      l && tt(b) && !et(y, b) && (m = nt(y, b));
      const S = m.maxX - m.minX, x = m.maxY - m.minY, A = S * a, P = x * a, k = m.minX - A, R = m.maxX + A, W = m.minY - P, I = m.maxY + P;
      r = h((C) => ({
        x: C.x,
        y: -C.y
      }));
      const V = u ? ot(s, p, g) : "";
      return o = `${k} ${-I} ${R - k} ${I - W}`, `<svg width="100%" height="100%" viewBox="${o}" preserveAspectRatio="xMidYMid meet">${V}${r}</svg>`;
    } else if (i) {
      const a = this.bbox, l = 0.2, u = a.maxX - a.minX, p = a.maxY - a.minY, g = u === 0 ? p : u, y = p === 0 ? u : p, b = a.minX - g * l, m = a.maxX + g * l, S = a.minY - y * l, x = a.maxY + y * l;
      r = h((A) => ({
        x: A.x,
        y: -A.y
      })), o = `${b} ${-x} ${m - b} ${x - S}`;
    } else
      o = "0 0 20 20", r = h((a) => ({
        x: a.x + 5,
        y: -a.y + 15
      }));
    return `<svg width="100%" height="100%" viewBox="${o}" preserveAspectRatio="xMidYMid meet">${r}</svg>`;
  }
}
const N = 8, X = 48, rt = 0.4, at = [
  52164,
  45795,
  49829,
  50150,
  54992,
  47610,
  54754,
  46532,
  51906,
  53947,
  49332,
  51706,
  46532,
  54224,
  52946,
  52714,
  52219,
  45755,
  51403,
  46532,
  53947,
  50410,
  49332,
  52219,
  52141,
  46532,
  50150,
  51120,
  50150,
  54992,
  51663,
  50119,
  53186,
  46532,
  46525,
  51365,
  52149,
  47016,
  46532,
  51889,
  51706,
  46025,
  47037,
  55031,
  48122,
  50935,
  47531,
  48122,
  51965,
  55e3
];
function T(c, t) {
  const { height: e, width: n, baseUp: i, baseDown: s } = c, o = e > 0 ? t / e : 1, r = o * i, h = o * s;
  return {
    size: t,
    capHeight: r,
    descenderHeight: h,
    cellWidth: o * n,
    totalHeight: r + h
  };
}
function ct(c, t, e) {
  if (c.header.fontType !== d.SHAPES || !(0 in c.content.data))
    return !1;
  const n = -(e.descenderHeight + e.capHeight * 0.2);
  return t.bbox.minY < n;
}
function G(c, t) {
  const e = -(t.descenderHeight + t.capHeight * 0.05);
  return !(c.bbox.minY < e || c.bbox.maxY - c.bbox.minY < t.capHeight * 0.05);
}
function ht(c, t, e) {
  if (c.header.fontType !== d.BIGFONT || c.content.baseDown > 0)
    return 0;
  const { height: n } = c.content;
  if (n <= 0)
    return 0;
  const i = n * rt, s = [], o = /* @__PURE__ */ new Set(), r = (a) => {
    if (o.has(a) || a <= 255 || !(a in c.content.data))
      return;
    o.add(a);
    const l = t(a);
    if (!l)
      return;
    const u = l.bbox.minY;
    u > 0 && u <= i && s.push(u);
  };
  for (const a of at)
    if (r(a), s.length >= X)
      break;
  if (s.length < N) {
    for (const a of Object.keys(c.content.data))
      if (r(Number(a)), s.length >= X)
        break;
  }
  if (s.length < N)
    return 0;
  s.sort((a, l) => a - l);
  const h = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[h - 1] + s[h]) / 2 : s[h];
}
function lt(c, t, e) {
  if (c.header.fontType !== d.UNIFONT)
    return !1;
  if (c.content.dualOrientation)
    return !0;
  const n = T(c.content, e);
  for (const i of [48, 65, 78, 49]) {
    if (!(i in c.content.data))
      continue;
    const s = t(i);
    if (s && G(s, n))
      return !0;
  }
  return !1;
}
function ut(c, t, e, n = E, i = !1, s = 0) {
  var a;
  let o = c;
  if (t.header.fontType === d.BIGFONT && s > 0) {
    const l = t.content.height > 0 ? e.size / t.content.height : 1;
    o = o.offset(new f(0, -s * l), !0);
  }
  if (t.header.fontType === d.UNIFONT || ct(t, c, e)) {
    const l = t.header.fontType === d.UNIFONT && (i || t.content.dualOrientation || G(c, e));
    (t.header.fontType === d.UNIFONT ? !l : !0) && (o = o.offset(new f(0, e.capHeight), !0));
  }
  const r = n.resolve(o, e.cellWidth), h = n.markAlignedAdvanceExplicit(o) ? !0 : o.hasExplicitAdvance;
  return new v(
    new f(r, ((a = o.lastPoint) == null ? void 0 : a.y) ?? 0),
    o.polylines,
    h
  );
}
function dt(c, t, e, n = E, i = !1, s = 0) {
  const o = T(t.content, e);
  return ut(
    c,
    t,
    o,
    n,
    i,
    s
  );
}
const Y = Math.PI / 4;
class B {
  /**
   * Creates a bulge-defined arc
   * @param start Start point
   * @param end End point
   * @param bulge Bulge factor (-1 to 1, where 1 is a semicircle)
   */
  static fromBulge(t, e, n) {
    const i = Math.max(-1, Math.min(1, n));
    return new B({
      start: t,
      end: e,
      bulge: i
    });
  }
  /**
   * Creates an octant-defined arc
   * @param center Center point of the arc
   * @param radius Radius of the arc
   * @param startOctant Starting octant (0-7)
   * @param octantCount Number of octants to span (0-8, where 0 means 8 octants)
   * @param isClockwise Whether the arc goes clockwise
   */
  static fromOctant(t, e, n, i, s) {
    return new B({
      center: t,
      radius: e,
      startOctant: n,
      octantCount: i,
      isClockwise: s
    });
  }
  constructor(t) {
    if (t.start && t.end && t.bulge !== void 0) {
      this.start = t.start.clone(), this.end = t.end.clone(), this.bulge = t.bulge, this.isClockwise = t.bulge < 0;
      const e = this.end.clone().subtract(this.start), n = e.length();
      if (Math.abs(this.bulge) * n / 2 === 0) {
        this.radius = 0, this.center = this.start.clone(), this.startAngle = Math.atan2(e.y, e.x), this.endAngle = this.startAngle;
        return;
      }
      const s = 4 * Math.atan(Math.abs(this.bulge));
      this.radius = n / (2 * Math.sin(s / 2));
      const o = this.start.clone().add(e.clone().divide(2)), r = new f(-e.y, e.x);
      r.normalize(), r.multiply(Math.abs(this.radius * Math.cos(s / 2))), this.center = o.clone(), this.isClockwise ? this.center.subtract(r) : this.center.add(r), this.startAngle = Math.atan2(this.start.y - this.center.y, this.start.x - this.center.x), this.endAngle = Math.atan2(this.end.y - this.center.y, this.end.x - this.center.x), this.isClockwise ? this.endAngle >= this.startAngle && (this.endAngle -= 2 * Math.PI) : this.endAngle <= this.startAngle && (this.endAngle += 2 * Math.PI);
    } else if (t.center && t.radius !== void 0 && t.startOctant !== void 0 && t.octantCount !== void 0 && t.isClockwise !== void 0) {
      this.center = t.center.clone(), this.radius = t.radius, this.isClockwise = t.isClockwise, this.startAngle = t.startOctant * Y;
      const e = (t.octantCount === 0 ? 8 : t.octantCount) * Y;
      this.endAngle = this.startAngle + (this.isClockwise ? -e : e), this.start = this.center.clone().add(
        new f(
          this.radius * Math.cos(this.startAngle),
          this.radius * Math.sin(this.startAngle)
        )
      ), this.end = this.center.clone().add(
        new f(this.radius * Math.cos(this.endAngle), this.radius * Math.sin(this.endAngle))
      );
    } else
      throw new Error("Invalid arc parameters");
  }
  /**
   * Tessellates the arc into a series of points that approximate the arc.
   * @param circleSpan The angle span between tessellated points (default Math.PI / 18)
   * @returns Array of points representing the tessellated arc
   */
  tessellate(t = Math.PI / 18) {
    if (this.radius === 0)
      return [this.start.clone(), this.end.clone()];
    const e = [this.start.clone()], n = Math.abs(this.endAngle - this.startAngle), i = Math.max(1, Math.floor(n / t));
    for (let s = 1; s < i; s++) {
      const o = s / i, r = this.isClockwise ? this.startAngle - o * n : this.startAngle + o * n;
      e.push(
        this.center.clone().add(new f(this.radius * Math.cos(r), this.radius * Math.sin(r)))
      );
    }
    return e.push(
      this.end ? this.end.clone() : this.center.clone().add(
        new f(
          this.radius * Math.cos(this.endAngle),
          this.radius * Math.sin(this.endAngle)
        )
      )
    ), e;
  }
}
const ft = Math.PI / 18, gt = 1e-6;
class pt {
  constructor(t) {
    this.shapeCache = /* @__PURE__ */ new Map(), this.subshapeCache = /* @__PURE__ */ new Map(), this.shapeData = /* @__PURE__ */ new Map(), this.fontData = t;
  }
  /**
   * Releases parsed shapes and cached shapes
   */
  release() {
    this.shapeCache.clear(), this.subshapeCache.clear(), this.shapeData.clear();
  }
  /**
   * Parses a character's shape with the given font size.
   * @param code - The character code
   * @param size - The font size
   * @returns The parsed shape or undefined if the character is not found
   */
  getCharShape(t, e) {
    const i = this.fontData.header.fontType === d.SHAPES && !(0 in this.fontData.content.data) ? e : e / this.fontData.content.height;
    return this.parseAndScale(t, { factor: i });
  }
  /**
   * Parses a character's shape with scaling options
   * @param code - The character code
   * @param options - Scaling options (factor or height/width)
   * @returns The parsed shape or undefined if the character is not found
   */
  parseAndScale(t, e) {
    if (t === 0)
      return;
    let n;
    if (this.shapeCache.has(t))
      n = this.shapeCache.get(t);
    else {
      const i = this.fontData.content.data;
      if (i[t]) {
        const s = this.prepareBigfontGlyphBytecode(t, i[t]), o = this.fontData.header.fontType !== d.BIGFONT;
        n = this.parseShape(s, { flushOnEnd: !0, initialPenDown: o }), this.shapeData.set(t, n), this.shapeCache.set(t, n);
      }
    }
    if (n) {
      if (e.factor !== void 0)
        return this.scaleShapeByFactor(n, e.factor);
      if (e.height !== void 0) {
        const i = e.width ?? e.height;
        return this.scaleShapeByHeightAndWidth(n, e.height, i);
      } else
        return n;
    }
  }
  /** Strips the embedded character-code prefix from dual-byte BIGFONT parent glyphs. */
  prepareBigfontGlyphBytecode(t, e) {
    if (this.fontData.header.fontType !== d.BIGFONT || t <= 255)
      return e;
    const n = t >> 8 & 255, i = t & 255;
    if (e.length >= 2 && e[0] === n && e[1] === i) {
      let s = 2;
      return e[s] === 0 && s++, e.slice(s);
    }
    return e;
  }
  /**
   * Dual-orientation vertical BIGFONT files (e.g. gbcbig.shx) use 0x8e/0x8f markers on
   * code 7 instead of real subshapes. Only the marker byte is skipped; following setup
   * commands (push / pen up / xy origin) are executed normally.
   */
  isVerticalDualBigfontMarker(t, e, n) {
    return this.fontData.content.verticalDualMode ? n === "open" ? t[e] === 142 : t[e] === 143 : !1;
  }
  /**
   * Scales a shape according to the given scale factor
   * @param shape - The shape to scale
   * @param factor - The scale factor
   * @returns The scaled shape
   */
  scaleShapeByFactor(t, e) {
    var n;
    return new v(
      (n = t.lastPoint) == null ? void 0 : n.clone().multiply(e),
      t.polylines.map((i) => i.map((s) => s.clone().multiply(e))),
      t.hasExplicitAdvance
    );
  }
  /**
   * Scales a shape according to the given height and width
   * @param shape - The shape to scale
   * @param height - The target height
   * @param width - The target width
   * @returns The scaled shape
   */
  scaleShapeByHeightAndWidth(t, e, n) {
    var u;
    const i = t.bbox, s = i.maxY - i.minY, o = i.maxX - i.minX, r = s > 0 ? e / s : 1, h = o > 0 ? n / o : 1, a = (u = t.lastPoint) == null ? void 0 : u.clone();
    a && (a.x *= h, a.y *= r);
    const l = t.polylines.map(
      (p) => p.map((g) => {
        const y = g.clone();
        return y.x *= h, y.y *= r, y;
      })
    );
    return new v(a, l, t.hasExplicitAdvance);
  }
  /**
   * Whether code 14 (0x0E) should skip the following command for the current layout.
   * Defaults to horizontal text layout when no orientation is supplied.
   */
  shouldSkipVerticalFlagCommand(t = !1) {
    const { content: e, header: n } = this.fontData;
    return n.fontType === d.BIGFONT ? !e.verticalDualMode : e.dualOrientation ? !t : e.orientation === "horizontal";
  }
  /** Marks that bytecode explicitly defines horizontal advance. */
  markAdvanceDefined(t) {
    t.hasExplicitAdvance = !0;
  }
  /** Records a terminal pen-up XY move (codes 8/9). */
  notePenUpPositioning(t) {
    t.pendingTerminalAdvance = !0;
  }
  /** Clears a pending advance when later bytecode supersedes the prior XY move. */
  clearPendingAdvance(t) {
    t.pendingTerminalAdvance = !1;
  }
  stateHasInk(t) {
    return t.currentPolyline.length > 1 ? !0 : t.polylines.some((e) => e.length >= 2);
  }
  /**
   * Confirms terminal pen-up XY (codes 8/9) as advance definition.
   * Ignores closure moves that return to the origin after drawing (e.g. txt `A`).
   */
  finalizeAdvanceFlag(t) {
    if (!t.pendingTerminalAdvance)
      return;
    const e = t.currentPoint.x;
    if (Math.abs(e) > gt) {
      t.hasExplicitAdvance = !0;
      return;
    }
    this.stateHasInk(t) || (t.hasExplicitAdvance = !0);
  }
  /**
   * Parses the shape of a character.
   * @param data - The data of the character
   * @param options - Optional parse settings
   * @returns The parsed shape
   */
  parseShape(t, e = {}) {
    let n = new f();
    const i = [];
    let s = [];
    const o = [];
    let r = e.initialPenDown ?? !1;
    r && s.push(n.clone());
    const h = {
      currentPoint: n,
      polylines: i,
      currentPolyline: s,
      sp: o,
      isPenDown: r,
      scale: 1,
      // Top-level glyphs flush trailing pen-down strokes at 0x00. Subshape
      // primitives and inherited-pen unifont subshapes (amgdt %%132) opt in
      // via flushOnEnd; bigfont subshape cache keeps flush off to avoid regressions.
      flushEndPolyline: e.flushOnEnd ?? !1,
      hasExplicitAdvance: !1,
      pendingTerminalAdvance: !1
    };
    for (let a = 0; a < t.length; a++) {
      const l = t[a];
      l <= 15 ? a = this.handleSpecialCommand(l, t, a, h) : (this.clearPendingAdvance(h), this.handleVectorCommand(l, h));
    }
    return this.finalizeAdvanceFlag(h), this.buildShapeFromState(h);
  }
  /** Builds a shape result, including any trailing pen-down polyline. */
  buildShapeFromState(t) {
    const e = t.polylines.map((n) => n.map((i) => i.clone()));
    return t.currentPolyline.length > 1 && e.push(t.currentPolyline.map((n) => n.clone())), new v(t.currentPoint.clone(), e, t.hasExplicitAdvance);
  }
  /**
   * Please refer to special codes reference in the following link for more information.
   * https://help.autodesk.com/view/OARX/2023/ENU/?guid=GUID-06832147-16BE-4A66-A6D0-3ADF98DC8228
   * @param command - The command byte
   * @param data - The data of the character
   * @param index - The index of the command byte
   * @param state - The state of the parser
   * @returns The index of the next command byte
   */
  handleSpecialCommand(t, e, n, i) {
    let s = n;
    switch (t) {
      case 0:
        this.finalizeAdvanceFlag(i), i.flushEndPolyline && i.currentPolyline.length > 1 ? (i.polylines.push(i.currentPolyline.slice()), i.currentPolyline = []) : i.flushEndPolyline && (i.currentPolyline = []), i.isPenDown = !1;
        break;
      case 1:
        this.clearPendingAdvance(i), i.isPenDown || i.currentPolyline.push(i.currentPoint.clone()), i.isPenDown = !0;
        break;
      case 2:
        i.isPenDown = !1, i.currentPolyline.length > 1 && i.polylines.push(i.currentPolyline.slice()), i.currentPolyline = [];
        break;
      case 3:
        this.clearPendingAdvance(i), s++, i.scale /= e[s];
        break;
      case 4:
        this.clearPendingAdvance(i), s++, i.scale *= e[s];
        break;
      case 5:
        if (this.clearPendingAdvance(i), i.sp.length === 4)
          throw new Error("The position stack is only four locations deep");
        i.sp.push(i.currentPoint.clone());
        break;
      case 6:
        this.clearPendingAdvance(i), i.currentPoint = i.sp.pop() ?? i.currentPoint, i.currentPolyline.length > 1 && (i.polylines.push(i.currentPolyline.slice()), i.currentPolyline = []), i.isPenDown && i.currentPolyline.push(i.currentPoint.clone());
        break;
      case 7:
        this.clearPendingAdvance(i), s = this.handleSubshapeCommand(e, s, i);
        break;
      case 8:
        s = this.handleXYDisplacement(e, s, i);
        break;
      case 9:
        s = this.handleMultipleXYDisplacements(e, s, i);
        break;
      case 10:
        this.clearPendingAdvance(i), s = this.handleOctantArc(e, s, i);
        break;
      case 11:
        this.clearPendingAdvance(i), s = this.handleFractionalArc(e, s, i);
        break;
      case 12:
        this.clearPendingAdvance(i), s = this.handleBulgeArc(e, s, i);
        break;
      case 13:
        this.clearPendingAdvance(i), s = this.handleMultipleBulgeArcs(e, s, i);
        break;
      case 14:
        this.clearPendingAdvance(i), this.shouldSkipVerticalFlagCommand() && (s = this.skipCode(e, ++s));
        break;
    }
    return s;
  }
  handleVectorCommand(t, e) {
    const n = (t & 240) >> 4, i = t & 15, s = this.getVectorForDirection(i);
    e.currentPoint.add(s.multiply(n * e.scale)), e.isPenDown && e.currentPolyline.push(e.currentPoint.clone());
  }
  /**
   * Get the vector for the given direction code. Please refer to the following link for more information.
   * https://help.autodesk.com/view/OARX/2023/ENU/?guid=GUID-0A8E12A1-F4AB-44AD-8A9B-2140E0D5FD23
   * @param dir - The direction code of the vector
   * @returns Returns the vector for the given direction code
   */
  getVectorForDirection(t) {
    const e = new f();
    switch (t) {
      case 0:
        e.x = 1;
        break;
      case 1:
        e.x = 1, e.y = 0.5;
        break;
      case 2:
        e.x = 1, e.y = 1;
        break;
      case 3:
        e.x = 0.5, e.y = 1;
        break;
      case 4:
        e.y = 1;
        break;
      case 5:
        e.x = -0.5, e.y = 1;
        break;
      case 6:
        e.x = -1, e.y = 1;
        break;
      case 7:
        e.x = -1, e.y = 0.5;
        break;
      case 8:
        e.x = -1;
        break;
      case 9:
        e.x = -1, e.y = -0.5;
        break;
      case 10:
        e.x = -1, e.y = -1;
        break;
      case 11:
        e.x = -0.5, e.y = -1;
        break;
      case 12:
        e.y = -1;
        break;
      case 13:
        e.x = 0.5, e.y = -1;
        break;
      case 14:
        e.x = 1, e.y = -1;
        break;
      case 15:
        e.x = 1, e.y = -0.5;
        break;
    }
    return e;
  }
  handleSubshapeCommand(t, e, n) {
    let i = e, s = 0, o, r = n.scale * this.fontData.content.baseUp, h = r;
    const a = n.currentPoint.clone();
    switch (n.currentPolyline.length > 1 && (n.polylines.push(n.currentPolyline.slice()), n.currentPolyline = []), this.fontData.header.fontType) {
      case d.SHAPES:
        i++, s = t[i];
        break;
      case d.BIGFONT:
        if (i++, this.isVerticalDualBigfontMarker(t, i, "open"))
          return i;
        if (this.isVerticalDualBigfontMarker(t, i, "close"))
          return i + 1;
        s = t[i], s === 0 && (i++, s = t[i++] << 8 | t[i++], a.x = w.byteToSByte(t[i++]) * n.scale, a.y = w.byteToSByte(t[i++]) * n.scale, this.fontData.content.isExtended ? (h = t[i++] * n.scale, r = t[i] * n.scale) : (r = t[i] * n.scale, h = r));
        break;
      case d.UNIFONT:
        i++, s = t[i++] << 8 | t[i++], i--;
        break;
    }
    if (s !== 0)
      if (this.fontData.header.fontType === d.UNIFONT) {
        const l = n.isPenDown;
        o = this.getScaledSubshapeAtInsertPoint(
          s,
          h,
          r,
          a,
          l
        ), o != null && o.polylines.some((u) => u.length >= 2) && (n.polylines.push(...o.polylines.slice()), o.lastPoint && (n.currentPoint = o.lastPoint.clone()), n.currentPolyline = [], n.isPenDown && n.currentPolyline.push(n.currentPoint.clone()));
      } else if (this.fontData.header.fontType === d.SHAPES)
        o = this.getScaledSubshapeAtInsertPoint(
          s,
          h,
          r,
          a
        ), o && (n.polylines.push(...o.polylines.slice()), o.lastPoint && (n.currentPoint = o.lastPoint.clone(), o.hasExplicitAdvance && this.markAdvanceDefined(n))), n.currentPolyline = [], n.isPenDown && n.currentPolyline.push(n.currentPoint.clone());
      else {
        if (o = this.getScaledSubshapeAtInsertPoint(
          s,
          h,
          r,
          a
        ), o && (n.polylines.push(...o.polylines.slice()), s === 2 && o.lastPoint)) {
          const l = o.lastPoint.x - a.x;
          l > n.currentPoint.x && (n.currentPoint.x = l), this.markAdvanceDefined(n);
        }
        n.currentPolyline = [];
      }
    return i;
  }
  handleXYDisplacement(t, e, n) {
    let i = e;
    const s = new f();
    return s.x = w.byteToSByte(t[++i]), s.y = w.byteToSByte(t[++i]), n.currentPoint.add(s.multiply(n.scale)), n.isPenDown ? n.currentPolyline.push(n.currentPoint.clone()) : this.notePenUpPositioning(n), i;
  }
  handleMultipleXYDisplacements(t, e, n) {
    let i = e;
    for (; !(i + 1 >= t.length); ) {
      const s = new f();
      if (s.x = w.byteToSByte(t[++i]), s.y = w.byteToSByte(t[++i]), s.x === 0 && s.y === 0)
        break;
      n.currentPoint.add(s.multiply(n.scale)), n.isPenDown ? n.currentPolyline.push(n.currentPoint.clone()) : this.notePenUpPositioning(n);
    }
    return i;
  }
  handleOctantArc(t, e, n) {
    let i = e;
    const s = t[++i] * n.scale, o = w.byteToSByte(t[++i]), r = (o & 112) >> 4;
    let h = o & 7;
    const a = o < 0, l = Math.PI / 4 * r, u = n.currentPoint.clone().subtract(new f(Math.cos(l) * s, Math.sin(l) * s)), g = B.fromOctant(u, s, r, h, a).tessellate();
    return n.isPenDown && (n.currentPolyline.pop(), n.currentPolyline.push(...g.slice())), n.currentPoint = g[g.length - 1].clone(), i;
  }
  handleFractionalArc(t, e, n) {
    let i = e;
    const s = t[++i], o = t[++i], r = t[++i], h = t[++i], a = (r * 255 + h) * n.scale, l = w.byteToSByte(t[++i]), u = (l & 112) >> 4;
    let p = l & 7;
    p === 0 && (p = 8), o !== 0 && p--;
    const g = Math.PI / 4;
    let y = g * p, b = ft, m = 1;
    l < 0 && (b = -b, y = -y, m = -1);
    let S = g * u, x = S + y;
    S += g * s / 256 * m, x += g * o / 256 * m;
    const A = n.currentPoint.clone().subtract(new f(a * Math.cos(S), a * Math.sin(S)));
    if (n.currentPoint = A.clone().add(new f(a * Math.cos(x), a * Math.sin(x))), n.isPenDown) {
      let P = S;
      const k = [];
      if (k.push(
        A.clone().add(new f(a * Math.cos(P), a * Math.sin(P)))
      ), b > 0)
        for (; P + b < x; )
          P += b, k.push(
            A.clone().add(new f(a * Math.cos(P), a * Math.sin(P)))
          );
      else
        for (; P + b > x; )
          P += b, k.push(
            A.clone().add(new f(a * Math.cos(P), a * Math.sin(P)))
          );
      k.push(A.clone().add(new f(a * Math.cos(x), a * Math.sin(x)))), n.currentPolyline.push(...k);
    }
    return i;
  }
  handleBulgeArc(t, e, n) {
    let i = e;
    const s = new f();
    s.x = w.byteToSByte(t[++i]), s.y = w.byteToSByte(t[++i]);
    const o = w.byteToSByte(t[++i]);
    return n.currentPoint = this.handleArcSegment(
      n.currentPoint,
      s,
      o,
      n.scale,
      n.isPenDown,
      n.currentPolyline
    ), i;
  }
  handleMultipleBulgeArcs(t, e, n) {
    let i = e;
    for (; !(i + 1 >= t.length); ) {
      const s = new f();
      if (s.x = w.byteToSByte(t[++i]), s.y = w.byteToSByte(t[++i]), s.x === 0 && s.y === 0 || i + 1 >= t.length)
        break;
      const o = w.byteToSByte(t[++i]);
      n.currentPoint = this.handleArcSegment(
        n.currentPoint,
        s,
        o,
        n.scale,
        n.isPenDown,
        n.currentPolyline
      );
    }
    return i;
  }
  skipCode(t, e) {
    switch (t[e]) {
      case 0:
        break;
      case 1:
        break;
      case 2:
        break;
      case 3:
      case 4:
        e++;
        break;
      case 5:
        break;
      case 6:
        break;
      case 7:
        switch (this.fontData.header.fontType) {
          case d.SHAPES:
            e++;
            break;
          case d.BIGFONT:
            e++, this.isVerticalDualBigfontMarker(t, e, "open") ? e++ : this.isVerticalDualBigfontMarker(t, e, "close") ? e += 2 : t[e] === 0 && (e += this.fontData.content.isExtended ? 6 : 5);
            break;
          case d.UNIFONT:
            e += 2;
            break;
        }
        break;
      case 8:
        e += 2;
        break;
      case 9:
        for (; e++, !(e >= t.length); ) {
          const s = t[e];
          if (e++, e >= t.length)
            break;
          const o = t[e];
          if (s === 0 && o === 0)
            break;
        }
        break;
      case 10:
        e += 2;
        break;
      case 11:
        e += 5;
        break;
      case 12:
        e += 3;
        break;
      case 13:
        for (; e++, !(e >= t.length); ) {
          const s = t[e];
          if (e++, e >= t.length)
            break;
          const o = t[e];
          if (s === 0 && o === 0)
            break;
          e++;
        }
        break;
    }
    return e;
  }
  getScaledSubshapeAtInsertPoint(t, e, n, i, s = !1) {
    let o;
    if (s) {
      const l = this.fontData.content.data[t];
      if (!l)
        return;
      o = this.parseShape(l, { initialPenDown: !0, flushOnEnd: !0 });
    } else if (o = this.subshapeCache.get(t), !o) {
      const l = this.fontData.content.data[t];
      if (!l)
        return;
      const u = this.fontData.header.fontType !== d.BIGFONT;
      o = this.parseShape(l, {
        flushOnEnd: !1,
        initialPenDown: u
      }), this.shapeData.set(t, o), this.subshapeCache.set(t, o);
    }
    const r = this.fontData.header.fontType === d.BIGFONT ? void 0 : n / this.fontData.content.baseUp, h = o.polylines.some((l) => l.length > 0);
    return (r !== void 0 ? this.scaleShapeByFactor(o, r) : this.scaleShapeByHeightAndWidth(
      h ? o.normalizeToOrigin(!0) : o,
      n,
      e
    )).offset(i, !1);
  }
  /**
   * Handles drawing an arc segment with the given vector and bulge
   * @param currentPoint The starting point of the arc
   * @param vec The displacement vector
   * @param bulge The bulge value (will be normalized by 127.0)
   * @param scale The current scale factor
   * @param isPenDown Whether the pen is currently down (drawing)
   * @param currentPolyline The current polyline being built
   * @returns The new current point after the arc
   */
  handleArcSegment(t, e, n, i, s, o) {
    e.x *= i, e.y *= i, n < -127 && (n = -127);
    const r = t.clone();
    if (s)
      if (n === 0)
        o.push(r.clone().add(e));
      else {
        const h = r.clone().add(e), l = B.fromBulge(r, h, n / 127).tessellate();
        o.push(...l.slice(1));
      }
    return r.add(e), r;
  }
}
class wt {
  /**
   * Creates a new ShxFont instance.
   * @param data - Either raw binary data of the SHX font file (ArrayBuffer) or pre-parsed font data (ShxFontData)
   * @throws {Error} If the font data is invalid or cannot be parsed
   */
  constructor(t) {
    if (t instanceof ArrayBuffer) {
      const e = new w(t), i = new z().parse(e), o = J.createParser(i.fontType).parse(e);
      this.fontData = {
        header: i,
        content: o
      };
    } else
      this.fontData = t;
    this.shapeParser = new pt(this.fontData);
  }
  /**
   * Return true if this font contains glyph of the specified character. Otherwise, return false.
   * @param char - The character to check
   * @returns True if this font contains glyph of the specified character. Otherwise, return false.
   */
  hasChar(t) {
    return this.fontData.content.data[t] !== void 0;
  }
  /**
   * Return true if this font contains a shape with the specified name. Otherwise, return false.
   * Shape names are matched case-insensitively.
   * @param name - The shape name to check (for example, "GRS")
   * @returns True if this font contains the named shape. Otherwise, return false.
   */
  hasShape(t) {
    return this.getShapeCode(t) !== void 0;
  }
  /**
   * Gets the character code for a named shape.
   * @param name - The shape name to look up
   * @returns The character code, or undefined if the shape is not found
   */
  getShapeCode(t) {
    const e = this.fontData.content.names;
    if (e)
      return e[t.toUpperCase()];
  }
  /**
   * Gets the shape name for a character code, if one is defined.
   * @param code - The character code to look up
   * @returns The shape name, or undefined if the code has no name
   */
  getShapeName(t) {
    var i;
    const e = (i = this.fontData.content.codeToName) == null ? void 0 : i[t];
    if (e !== void 0)
      return e;
    const n = this.fontData.content.names;
    if (n) {
      for (const [s, o] of Object.entries(n))
        if (o === t)
          return s;
    }
  }
  /**
   * Returns scaled font metrics for a target render size.
   * @param size - Target font size in drawing units
   */
  getFontMetrics(t) {
    return T(this.fontData.content, t);
  }
  /**
   * Returns a layout-ready glyph: scaled geometry with baseline alignment applied.
   *
   * Prefer this over {@link ShxFont.getCharShape} when placing text for display.
   *
   * @param code - The character code to get the shape for
   * @param size - The desired font size
   */
  getLayoutCharShape(t, e, n = E) {
    const i = this.getCharShape(t, e);
    if (i)
      return dt(
        i,
        this.fontData,
        e,
        n,
        this.usesUnifontBaselineOriginFont(e),
        this.getBigfontBaselineInkPaddingNative()
      );
  }
  /**
   * Returns the cached median baseline ink padding for BIGFONT layout normalization.
   *
   * @returns Padding in native font units from shape #0 height, or 0 when not applicable
   */
  getBigfontBaselineInkPaddingNative() {
    if (this.bigfontBaselineInkPaddingNative === void 0) {
      const t = this.fontData.content.height;
      this.bigfontBaselineInkPaddingNative = ht(
        this.fontData,
        (e) => this.getCharShape(e, t)
      );
    }
    return this.bigfontBaselineInkPaddingNative;
  }
  /**
   * Returns whether this UNIFONT encodes horizontal glyphs with baseline at y = 0.
   *
   * The result is computed once via {@link detectUnifontBaselineOriginFont} and cached,
   * because baseline-origin detection is independent of render size.
   *
   * @param size - Font size used when sampling glyph geometry for detection
   * @returns True when baseline-origin UNIFONT shifting should be skipped during layout
   */
  usesUnifontBaselineOriginFont(t) {
    return this.unifontBaselineOriginFont === void 0 && (this.unifontBaselineOriginFont = lt(
      this.fontData,
      (e) => this.getCharShape(e, t),
      t
    )), this.unifontBaselineOriginFont;
  }
  /**
   * Gets the shape data for a named shape at a given font size.
   * Shape names are matched case-insensitively.
   * @param name - The shape name to get the shape for
   * @param size - The desired font size
   * @returns The shape data for the named shape, or undefined if it is not found in the font
   */
  getShapeByName(t, e) {
    const n = this.getShapeCode(t);
    if (n !== void 0)
      return this.getCharShape(n, e);
  }
  /**
   * Gets the scaled shape geometry for a character code.
   *
   * Returns the glyph as encoded in the SHX file, scaled to `size`. Vertical placement
   * and mixed-font baseline alignment are the responsibility of the text renderer;
   * see the `textLayout` module and {@link ShxFont.getFontMetrics}.
   *
   * @param code - The character code to get the shape for
   * @param size - The desired font size
   * @returns The shape data for the character, or undefined if the character is not found in the font
   */
  getCharShape(t, e) {
    return this.shapeParser.getCharShape(t, e);
  }
  /**
   * Releases resources used by the font.
   * This should be called when the font is no longer needed to free up memory.
   */
  release() {
    this.shapeParser.release();
  }
}
function Pt(c) {
  if (c.lastPoint)
    return c.lastPoint.x;
  const { minX: t, maxX: e } = c.bbox;
  return e - t;
}
function yt(c, t, e, n = E) {
  const i = T(t.content, e);
  return n.resolve(c, i.cellWidth);
}
function bt(c, t, e = 0) {
  return c.offset(new f(t, e), !0);
}
function xt(c, t = 0, e = {}) {
  const n = e.advance ?? E;
  let i = 0;
  const s = [];
  for (const { font: o, code: r, size: h } of c) {
    const a = o.getLayoutCharShape(r, h, n);
    a && (s.push({
      shape: bt(a, i, t),
      x: i
    }), i += yt(a, o.fontData, h, n));
  }
  return s;
}
export {
  D as DEFAULT_INK_WIDTH_CELL_FACTOR,
  M as InkWidthAdvanceStrategy,
  f as Point,
  L as ShxAdvanceWidthStrategy,
  J as ShxContentParserFactory,
  wt as ShxFont,
  d as ShxFontType,
  mt as ShxNativeAdvanceStrategy,
  v as ShxShape,
  pt as ShxShapeParser,
  dt as alignShxGlyphForLayout,
  T as computeFontMetrics,
  E as defaultAdvanceWidthStrategy,
  ht as detectBigfontBaselineInkPadding,
  lt as detectUnifontBaselineOriginFont,
  Pt as getAdvanceWidth,
  xt as layoutTextRun,
  bt as placeGlyphOnBaseline,
  yt as resolveAdvanceWidth,
  ct as shapeEncodedWithTopOrigin,
  H as splitShapeNameAndBytecode,
  G as unifontUsesBaselineOrigin
};
//# sourceMappingURL=index.es.js.map
