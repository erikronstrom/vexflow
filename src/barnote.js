// [VexFlow](http://vexflow.com) - Copyright (c) Mohit Muthanna 2010.
//
// ## Description
//
// A `BarNote` is used to render bar lines (from `barline.js`). `BarNote`s can
// be added to a voice and rendered in the middle of a stave. Since it has no
// duration, it consumes no `tick`s, and is dealt with appropriately by the formatter.
//
// See `tests/barnote_tests.js` for usage examples.

import { Vex } from './vex';
import { Note } from './note';
import { Barline } from './stavebarline';
import { BoundingBox } from './boundingbox';

export var BarNote = (function() {
  function BarNote() { this.init(); }

  // To enable logging for this class. Set `Vex.Flow.BarNote.DEBUG` to `true`.
  function L() { if (BarNote.DEBUG) Vex.L("Vex.Flow.BarNote", arguments); }

  // ## Prototype Methods
  Vex.Inherit(BarNote, Note, {
    init: function() {
      BarNote.superclass.init.call(this, {duration: "b"});

      var TYPE = Barline.type;
      this.metrics = {
        widths: {}
      };

      // Defined this way to prevent lint errors.
      this.metrics.widths[TYPE.SINGLE] = 8;
      this.metrics.widths[TYPE.DOUBLE] = 12;
      this.metrics.widths[TYPE.END] = 15;
      this.metrics.widths[TYPE.REPEAT_BEGIN] = 14;
      this.metrics.widths[TYPE.REPEAT_END] = 14;
      this.metrics.widths[TYPE.REPEAT_BOTH] = 18;
      this.metrics.widths[TYPE.NONE] = 0;

      // Tell the formatter that bar notes have no duration.
      this.ignore_ticks = true;
      this.type = TYPE.SINGLE;

      // Set width to width of relevant `Barline`.
      this.setWidth(this.metrics.widths[this.type]);
    },

    // Get and set the type of Bar note. `type` must be one of `Vex.Flow.Barline.type`.
    getType: function() { return this.type; },
    setType: function(type) {
      this.type = type;
      this.setWidth(this.metrics.widths[this.type]);
      return this;
    },

    getBoundingBox: function() {
      return new BoundingBox(0, 0, 0, 0);
    },

    addToModifierContext: function() {
      /* overridden to ignore */
      return this;
    },

    preFormat: function() {
      /* overridden to ignore */
      this.setPreFormatted(true);
      return this;
    },

    // Render note to stave.
    draw: function() {
      if (!this.stave) throw new Vex.RERR("NoStave", "Can't draw without a stave.");
      L("Rendering bar line at: ", this.getAbsoluteX());
      var barline = new Barline(this.type);
      barline.setX(this.getAbsoluteX());
      this.elem = this.context.openGroup("barline", this.id);
      barline.draw(this.stave);
      this.context.closeGroup();
    }
  });

  return BarNote;
}());
