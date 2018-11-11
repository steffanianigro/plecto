import assert from 'assert';
import DSP from '../src/imports/utils/dsp.js'
const dsp = new DSP

const mfcc = new dsp.MFCC(64, 32, 300, 3500, 8000);

describe('FFT', function () {
  describe('Output should be valid', () => {
    it('Freq is valid', function () {
        var sineOscillator = new dsp.Oscillator(dsp.types.waveforms.SINE, 440, 0.5, 32768, 44100)
        var sine = sineOscillator.generate()
        var segment = dsp.getFFTAudioSegment(sine, 32768);
        var fftBins = dsp.getFFTBins(segment, 32768);
        var freq = dsp.getMaxFrequency(fftBins.avg, 44100);
        assert.equal(Math.ceil(freq), 440);
    });

    it('Parrallel Freq is valid', () => {
        var sineOscillator = new dsp.Oscillator(dsp.types.waveforms.SINE, 440, 0.5, 32768, 44100)
        var sine = sineOscillator.generate()
        var segment = dsp.getFFTAudioSegment(sine, 32768);
        return new Promise((resolve, reject) => {
          dsp.getParallelFFTBins(segment, 32768, (err, fftBins) => {
            var freq = dsp.getMaxFrequency(fftBins.avg, 44100);
            if(err){
              return reject(err)
            }
            resolve(freq)
          });
        }).then((freq) => {
          assert.equal(Math.ceil(freq), 440);
        })
    });

  }); 
});