// [VexFlow](http://vexflow.com) - Copyright (c) Mohit Muthanna 2010.

import { Vex } from './vex';
import { BoundingBoxComputation } from './boundingboxcomputation';
import { Font } from './fonts/vexflow_font';

/**
 * @constructor
 */
export var Glyph = (function() {
  function Glyph(code, point, options) {
    this.code = code;
    this.point = point;
    this.context = null;
    this.options = {
      cache: true,
      font: Font
    };

    this.metrics = null;
    this.x_shift = 0;
    this.y_shift = 0;

    if (options) {
      this.setOptions(options);
    } else {
      this.reset();
    }
  }

  Glyph.prototype = {
    setOptions: function(options) {
      Vex.Merge(this.options, options);
      this.reset();
    },

    setPoint: function(point) { this.point = point; return this; },
    setStave: function(stave) { this.stave = stave; return this; },
    setXShift: function(x_shift) { this.x_shift = x_shift; return this; },
    setYShift: function(y_shift) { this.y_shift = y_shift; return this; },
    setContext: function(context) { this.context = context; return this; },
    getContext: function() { return this.context; },

    reset: function() {
      this.scale = this.point * 72 / (this.options.font.resolution * 100);
      this.metrics = Glyph.loadMetrics(
        this.options.font,
        this.code,
        this.options.cache
      );
      this.bbox = Glyph.getOutlineBoundingBox(
        this.metrics.outline,
        this.scale,
        0,
        0
      );
    },

    getMetrics: function() {
      if (!this.metrics) throw new Vex.RuntimeError("BadGlyph", "Glyph " +
        this.code + " is not initialized.");

      return {
        x_min: this.metrics.x_min * this.scale,
        x_max: this.metrics.x_max * this.scale,
        width: this.bbox.getW(),
        height: this.bbox.getH()
      };
    },

    render: function(ctx, x_pos, y_pos) {
      if (!this.metrics) throw new Vex.RuntimeError("BadGlyph", "Glyph " +
          this.code + " is not initialized.");

      var outline = this.metrics.outline;
      var scale = this.scale;

      Glyph.renderOutline(ctx, outline, scale, x_pos, y_pos);
    },

    renderToStave: function(x) {
      if (!this.metrics) throw new Vex.RuntimeError("BadGlyph", "Glyph " +
          this.code + " is not initialized.");
      if (!this.stave) throw new Vex.RuntimeError("GlyphError", "No valid stave");
      if (!this.context) throw new Vex.RERR("GlyphError", "No valid context");

      var outline = this.metrics.outline;
      var scale = this.scale;

      Glyph.renderOutline(this.context, outline, scale,
          x + this.x_shift, this.stave.getYForGlyphs() + this.y_shift);
    }
  };

  /* Static methods used to implement loading / unloading of glyphs */
  Glyph.loadMetrics = function(font, code, cache) {
    var glyph = font.glyphs[code];
    if (!glyph) throw new Vex.RuntimeError("BadGlyph", "Glyph " + code +
        " does not exist in font.");

    var x_min = glyph.x_min;
    var x_max = glyph.x_max;
    var ha = glyph.ha;

    var outline;

    if (glyph.o) {
      if (cache) {
        if (glyph.cached_outline) {
          outline = glyph.cached_outline;
        } else {
          outline = glyph.o.split(' ');
          glyph.cached_outline = outline;
        }
      } else {
        if (glyph.cached_outline) delete glyph.cached_outline;
        outline = glyph.o.split(' ');
      }

      return {
        x_min: x_min,
        x_max: x_max,
        ha: ha,
        outline: outline
      };
    } else {
      throw new Vex.RuntimeError("BadGlyph", "Glyph " + code +
          " has no outline defined.");
    }
  };

  /**
   * A quick and dirty static glyph renderer. Renders glyphs from the default
   * font defined in Vex.Flow.Font.
   *
   * @param {!Object} ctx The canvas context.
   * @param {number} x_pos X coordinate.
   * @param {number} y_pos Y coordinate.
   * @param {number} point The point size to use.
   * @param {string} val The glyph code in Vex.Flow.Font.
   * @param {boolean} nocache If set, disables caching of font outline.
   */
  Glyph.renderGlyph = function(ctx, x_pos, y_pos, point, val, nocache) {
    var scale = point * 72.0 / (Font.resolution * 100.0);
    var metrics = Glyph.loadMetrics(Font, val, !nocache);
    Glyph.renderOutline(ctx, metrics.outline, scale, x_pos, y_pos);
  };

  Glyph.renderOutline = function(ctx, outline, scale, x_pos, y_pos) {
    ctx.beginPath();
    ctx.moveTo(x_pos, y_pos);
    processOutline(outline, x_pos, y_pos, scale, -scale, {
      m: ctx.moveTo.bind(ctx),
      l: ctx.lineTo.bind(ctx),
      q: ctx.quadraticCurveTo.bind(ctx),
      b: ctx.bezierCurveTo.bind(ctx)
    });
    ctx.fill();
  };

  Glyph.getOutlineBoundingBox = function(outline, scale, x_pos, y_pos) {
    var bboxComp = new BoundingBoxComputation(x_pos, y_pos);

    processOutline(outline, x_pos, y_pos, scale, -scale, {
      m: bboxComp.addPoint.bind(bboxComp),
      l: bboxComp.addPoint.bind(bboxComp),
      q: bboxComp.addQuadraticCurve.bind(bboxComp),
      b: bboxComp.addBezierCurve.bind(bboxComp)
    });

    return new Vex.Flow.BoundingBox(
      bboxComp.x1,
      bboxComp.y1,
      bboxComp.width(),
      bboxComp.height()
    );
  };

  function processOutline(outline, originX, originY, scaleX, scaleY, outlineFns) {
    var command;
    var x;
    var y;
    var i = 0;

    function nextX() { return originX + outline[i++] * scaleX; }
    function nextY() { return originY + outline[i++] * scaleY; }

    while (i < outline.length) {
      command = outline[i++];
      switch (command) {
        case 'm':
        case 'l':
          outlineFns[command](nextX(), nextY());
          break;
        case 'q':
          x = nextX();
          y = nextY();
          outlineFns.q(nextX(), nextY(), x, y);
          break;
        case 'b':
          x = nextX();
          y = nextY();
          outlineFns.b(nextX(), nextY(), nextX(), nextY(), x, y);
          break;
      }
    }
  }

  return Glyph;
}());
