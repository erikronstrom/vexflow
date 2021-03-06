// [VexFlow](http://vexflow.com) - Copyright (c) Mohit Muthanna 2010.
//
// ## Description
// The tickable interface. Tickables are things that sit on a score and
// have a duration, i.e., they occupy space in the musical rendering dimension.

import { Vex } from './vex';
import { Flow } from './tables';
import { Fraction } from './fraction';

export var Tickable = (function() {
  function Tickable() {
    this.init();
  }

  Tickable.prototype = {
    init: function() {
      this.intrinsicTicks = 0;
      this.tickMultiplier = new Fraction(1, 1);
      this.ticks = new Fraction(0, 1);
      this.width = 0;
      this.x_shift = 0; // Shift from tick context
      this.voice = null;
      this.tickContext = null;
      this.modifierContext = null;
      this.modifiers = [];
      this.preFormatted = false;
      this.postFormatted = false;
      this.tuplet = null;
      this.tupletStack = [];

      // For interactivity
      this.id = null;
      this.elem = null;

      this.align_center = false;
      this.center_x_shift = 0; // Shift from tick context if center aligned

      // This flag tells the formatter to ignore this tickable during
      // formatting and justification. It is set by tickables such as BarNote.
      this.ignore_ticks = false;
      this.context = null;
    },

    setContext: function(context) { this.context = context; },

    // Set the DOM ID of the element. Must be called before draw(). TODO: Update
    // ID of element if has already been rendered.
    setId: function(id) { this.id = id; },
    getId: function() { return this.id; },
    getElem: function() { return this.elem; },
    getBoundingBox: function() { return null; },
    getTicks: function() { return this.ticks; },
    shouldIgnoreTicks: function() { return this.ignore_ticks; },
    getWidth: function() { return this.width; },
    setXShift: function(x) { this.x_shift = x; },
    getCenterXShift: function() {
      if (this.isCenterAligned()) {
        return this.center_x_shift;
      }

      return 0;
    },

    isCenterAligned: function() { return this.align_center; },
    setCenterAlignment: function(align_center) {
      this.align_center = align_center;
      return this;
    },

    // Every tickable must be associated with a voice. This allows formatters
    // and preFormatter to associate them with the right modifierContexts.
    getVoice: function() {
      if (!this.voice) throw new Vex.RERR("NoVoice", "Tickable has no voice.");
      return this.voice;
    },
    setVoice: function(voice) { this.voice = voice; },

    getTuplet: function() { return this.tuplet; },

    /*
     * resetTuplet
     * @param tuplet -- the specific tuplet to reset
     *   if this is not provided, all tuplets are reset.
     * @returns this
     *
     * Removes any prior tuplets from the tick calculation and
     * resets the intrinsic tick value to
     */
    resetTuplet: function(tuplet) {
      var noteCount, notesOccupied;
      if(tuplet){
        var i = this.tupletStack.indexOf(tuplet);
        if(i !== -1){
          this.tupletStack.splice(i, 1);
          noteCount = tuplet.getNoteCount();
          notesOccupied = tuplet.getNotesOccupied();

          // Revert old multiplier by inverting numerator & denom.:
          this.applyTickMultiplier(noteCount, notesOccupied);
        }
        return this;
      }

      while(this.tupletStack.length){
        tuplet = this.tupletStack.pop();
        noteCount = tuplet.getNoteCount();
        notesOccupied = tuplet.getNotesOccupied();

        // Revert old multiplier by inverting numerator & denom.:
        this.applyTickMultiplier(noteCount, notesOccupied);
      }
      return this;
    },

    setTuplet: function(tuplet) {
      // Attach to new tuplet

      if (tuplet) {
        this.tupletStack.push(tuplet);

        var noteCount = tuplet.getNoteCount();
        var notesOccupied = tuplet.getNotesOccupied();

        this.applyTickMultiplier(notesOccupied, noteCount);
      }

      this.tuplet = tuplet;

      return this;
    },

    /** optional, if tickable has modifiers **/
    addToModifierContext: function(mc) {
      this.modifierContext = mc;
      // Add modifiers to modifier context (if any)
      this.preFormatted = false;
    },

    /** optional, if tickable has modifiers **/
    addModifier: function(mod) {
      this.modifiers.push(mod);
      this.preFormatted = false;
      return this;
    },

    setTickContext: function(tc) {
      this.tickContext = tc;
      this.preFormatted = false;
    },

    preFormat: function() {
      if (this.preFormatted) return;

      this.width = 0;
      if (this.modifierContext) {
        this.modifierContext.preFormat();
        this.width += this.modifierContext.getWidth();
      }
    },
    postFormat: function() {
      if (this.postFormatted) return;
      this.postFormatted = true;
      return this;
    },
    getIntrinsicTicks: function() {
      return this.intrinsicTicks;
    },
    setIntrinsicTicks: function(intrinsicTicks) {
      this.intrinsicTicks = intrinsicTicks;
      this.ticks = this.tickMultiplier.clone().multiply(this.intrinsicTicks);
    },
    getTickMultiplier: function() {
      return this.tickMultiplier;
    },
    applyTickMultiplier: function(numerator, denominator) {
      this.tickMultiplier.multiply(numerator, denominator);
      this.ticks = this.tickMultiplier.clone().multiply(this.intrinsicTicks);
    },
    setDuration: function(duration) {
      var ticks = duration.numerator * (Flow.RESOLUTION / duration.denominator);
      this.ticks = this.tickMultiplier.clone().multiply(ticks);
      this.intrinsicTicks = this.ticks.value();
    }
  };

  return Tickable;
}());
