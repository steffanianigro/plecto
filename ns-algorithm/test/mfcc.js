import assert from 'assert';
import DSP from '../src/imports/utils/dsp.js'
const dsp = new DSP

const mfcc = new dsp.MFCC(64, 32, 300, 3500, 8000);

var flat = [1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1];

describe('MFCC', function () {
  describe('Output should be valid', function () {
    it('Length Test', function () {
      var coef = mfcc.process(flat);

      assert.equal(coef.length, 13);
    });
    
    it('Flat Test', function () {
      var coef = mfcc.process(flat);

      // First coefficient should be large and all the others should be low since
      // the input magnitudes are all flat.
      for (var i = 1; i < coef.length; i++)
        assert(Math.abs(coef[0]) > Math.abs(coef[i]));
    });
  }); 
});