'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SampleBuffer = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _computeVariance = require('compute-variance');

var _computeVariance2 = _interopRequireDefault(_computeVariance);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var napa = require('napajs');
var zone = napa.zone.create('zone1', { workers: 4 });

// Math
var TWO_PI = 2 * Math.PI;
// Biquad filter parameter types
var BIQUAD_Q = 1;
var BIQUAD_BW = 2; // SHARED with BACKWARDS LOOP MODE
var BIQUAD_S = 3;

var sinh = function sinh(arg) {
  // Returns the hyperbolic sine of the number, defined as (exp(number) - exp(-number))/2 
  //
  // version: 1004.2314
  // discuss at: http://phpjs.org/functions/sinh    // +   original by: Onno Marsman
  // *     example 1: sinh(-0.9834330348825909);
  // *     returns 1: -1.1497971402636502
  return (Math.exp(arg) - Math.exp(-arg)) / 2;
};

var log = function log(m) {
  return Math.log(1 + m);
};

var types = {
  waveforms: {
    OSC_SINE: 1,
    OSC_TRIANGLE: 2,
    OSC_SAW: 3,
    OSC_SQUARE: 4,
    FLAT: 5
  },
  windowFunctions: {
    BARTLETT: 1,
    BARTLETTHANN: 2,
    BLACKMAN: 3,
    COSINE: 4,
    GAUSS: 5,
    HAMMING: 6,
    HANN: 7,
    LANCZOS: 8,
    RECTANGULAR: 9,
    TRIANGULAR: 10
  },
  biquadFilters: {
    LPF: 0, // H(s) = 1 / (s^2 + s/Q + 1)
    HPF: 1, // H(s) = s^2 / (s^2 + s/Q + 1)
    BPF_CONSTANT_SKIRT: 2, // H(s) = s / (s^2 + s/Q + 1)  (constant skirt gain, peak gain = Q)
    BPF_CONSTANT_PEAK: 3, // H(s) = (s/Q) / (s^2 + s/Q + 1)      (constant 0 dB peak gain)
    NOTCH: 4, // H(s) = (s^2 + 1) / (s^2 + s/Q + 1)
    APF: 5, // H(s) = (s^2 - s/Q + 1) / (s^2 + s/Q + 1)
    PEAKING_EQ: 6, // H(s) = (s^2 + s*(A/Q) + 1) / (s^2 + s/(A*Q) + 1)
    LOW_SHELF: 7, // H(s) = A * (s^2 + (sqrt(A)/Q)*s + A)/(A*s^2 + (sqrt(A)/Q)*s + 1)
    HIGH_SHELF: 8 // H(s) = A * (A*s^2 + (sqrt(A)/Q)*s + 1)/(s^2 + (sqrt(A)/Q)*s + A)
  }

  /**
   * DSP is an object which contains general purpose utility functions
   */
};
var DSP = function () {
  function DSP() {
    _classCallCheck(this, DSP);

    this.FourierTransform = FourierTransform;
    this.DFT = DFT;
    this.FFT = FFT;
    this.RFFT = RFFT;
    this.Oscillator = Oscillator;
    this.WindowFunction = WindowFunction;
    this.Biquad = Biquad;
    this.CTRNNUtil = CTRNNUtil;
    this.MFCC = MFCC;
    this.DCT = DCT;
    this.ParallelRFFT = ParallelRFFT;

    this.types = types;
  }
  /**
   * Inverts the phase of a signal
   *
   * @param {Array} buffer A sample buffer
   *
   * @returns The inverted sample buffer
   */


  _createClass(DSP, [{
    key: 'invert',
    value: function invert(buffer) {
      for (var i = 0, len = buffer.length; i < len; i++) {
        buffer[i] *= -1;
      }
      return buffer;
    }
    /**
     * Converts split-stereo (dual mono) sample buffers into a stereo interleaved sample buffer
     *
     * @param {Array} left  A sample buffer
     * @param {Array} right A sample buffer
     *
     * @returns The stereo interleaved buffer
     */

  }, {
    key: 'interleave',
    value: function interleave(left, right) {
      if (left.length !== right.length) {
        throw "Can not interleave. Channel lengths differ.";
      }
      var stereoInterleaved = new Float64Array(left.length * 2);
      for (var i = 0, len = left.length; i < len; i++) {
        stereoInterleaved[2 * i] = left[i];
        stereoInterleaved[2 * i + 1] = right[i];
      }
      return stereoInterleaved;
    }
    // Find RMS of signal

  }, {
    key: 'RMS',
    value: function RMS(buffer) {
      var total = 0;
      for (var i = 0, n = buffer.length; i < n; i++) {
        total += buffer[i] * buffer[i];
      }
      return Math.sqrt(total / n);
    }
    // Find Peak of signal

  }, {
    key: 'peak',
    value: function peak(buffer) {
      var peak = 0;
      for (var i = 0, n = buffer.length; i < n; i++) {
        peak = Math.abs(buffer[i]) > peak ? Math.abs(buffer[i]) : peak;
      }
      return peak;
    }
  }, {
    key: 'getFFTAudioSegment',
    value: function getFFTAudioSegment(audioBuffer, length) {
      var segment = void 0;
      if (typeof audioBuffer.getChannelData === 'undefined') {
        segment = audioBuffer;
      } else {
        segment = audioBuffer.getChannelData(0);
      }
      segment = this.getAudioSegment(segment, length);
      return segment;
    }
  }, {
    key: 'getLargeAudioSegment',
    value: function getLargeAudioSegment(audioBuffer) {
      var segment = void 0;
      if (typeof audioBuffer.getChannelData === 'undefined') {
        segment = audioBuffer;
      } else {
        segment = audioBuffer.getChannelData(0);
      }
      segment = this.getAudioSegment(segment, 32768);
      createFades(segment, 500);
      return segment;
    }
  }, {
    key: 'getDynamicVariance',
    value: function getDynamicVariance(audioBuffer, windowSize) {
      var segment = void 0;
      if (typeof audioBuffer.getChannelData === 'undefined') {
        segment = audioBuffer;
      } else {
        segment = audioBuffer.getChannelData(0);
      }

      var totalAverage = 0;
      var length = segment.length;

      for (var i = 0; i < length; i++) {
        var sample = segment[i];
        totalAverage += Math.pow(sample, 2);
      }
      totalAverage = totalAverage / length;

      var segments = Math.floor(length / windowSize);
      var totalVariance = 0;

      for (var _i = 0; _i < segments; _i++) {
        var windowAverage = 0;

        for (var j = 0; j < windowSize; j++) {
          var _sample = segment[j + _i * windowSize];
          windowAverage += Math.pow(_sample, 2);
        }
        windowAverage = windowAverage / windowSize;

        totalVariance += Math.abs(totalAverage - windowAverage);
      }

      return totalVariance;
    }
  }, {
    key: 'getReducedWave',
    value: function getReducedWave(bufferData) {
      var peaksArray = [];
      var length = bufferData.length;
      for (var i = 0; i < length; i++) {
        peaksArray.push({
          x: i,
          y: bufferData[i]
        });
        i += 100;
      }
      return peaksArray;
    }
  }, {
    key: 'getFFTBins',
    value: function getFFTBins(audioBuffer, widnowSize) {
      var windows = this.windowAudio(audioBuffer, widnowSize);
      var numWindows = windows.length;
      var fftBins = [];
      _lodash2.default.forEach(windows, function (win) {
        var bins = [];
        var fft = new RFFT(win.length, 44100);
        fft.forward(win);
        _lodash2.default.forEach(fft.spectrum, function (bin, index) {
          bins.push(bin);
        });
        fftBins.push(bins);
      });
      var avgFft = [];
      var fftLength = fftBins[0].length;

      var _loop = function _loop(bin) {
        var average = 0;
        _lodash2.default.forEach(fftBins, function (bins) {
          average += bins[bin];
        });
        average /= numWindows;
        avgFft.push(average);
      };

      for (var bin = 0; bin < fftLength; bin++) {
        _loop(bin);
      }
      return { avg: avgFft, spectrum: fftBins };
    }
  }, {
    key: 'getParallelFFTBins',
    value: function getParallelFFTBins(audioBuffer, widnowSize, cb) {
      var windows = this.windowAudio(audioBuffer, widnowSize);
      var numWindows = windows.length;
      var fftBins = [];

      var fftFunc = function fftFunc(win) {
        var bins = [];
        var spectrum = global.ParallelRFFT(win);
        var specLength = spectrum.length;
        for (var binIndex = 0; binIndex < specLength; binIndex++) {
          bins.push(spectrum[binIndex]);
        }
        return bins;
      };
      zone.broadcast(ParallelRFFT.toString());
      var promises = [];
      for (var win = 0; win < numWindows; win++) {
        promises[win] = zone.execute(fftFunc, [windows[win]]);
      }
      Promise.all(promises).then(function (values) {
        _lodash2.default.forEach(values, function (result) {
          fftBins.push(result.value);
        });
        var avgFft = [];
        var fftLength = fftBins[0].length;

        var _loop2 = function _loop2(bin) {
          var average = 0;
          _lodash2.default.forEach(fftBins, function (bins) {
            average += bins[bin];
          });
          average /= numWindows;
          avgFft.push(average);
        };

        for (var bin = 0; bin < fftLength; bin++) {
          _loop2(bin);
        }
        cb(null, { avg: avgFft, spectrum: fftBins });
      }).catch(cb);
    }
  }, {
    key: 'windowAudio',
    value: function windowAudio(audioBuffer, size) {
      var windowFunc = new WindowFunction(types.windowFunctions.HAMMING, 0.5);
      var windows = [];
      var wholeLength = audioBuffer.length;
      var overlap = size / 2;
      var tempWindow = [];
      var windowEnd = size;
      for (var i = 0; i <= wholeLength; i++) {
        if (i == windowEnd) {
          tempWindow = windowFunc.process(tempWindow);
          windows.push(tempWindow);
          tempWindow = [];
          windowEnd += overlap;
          i -= overlap;
        }
        tempWindow.push(audioBuffer[i]);
      }
      return windows;
    }
  }, {
    key: 'getMaxFrequency',
    value: function getMaxFrequency(fftBins, sampleRate) {
      var fft = new FourierTransform(fftBins.length * 2, 44100);
      var both = fftBins.map(function (bin, index) {
        return {
          frequency: fft.getBandFrequency(index),
          magnitude: bin
        };
      });
      var maxFreq = 0;
      var max = 0;
      var length = both.length;
      for (var i = 1; i < length; i++) {
        // multiply spectrum by a zoom value
        var mag = both[i].magnitude;
        if (mag > max) {
          max = mag;
          maxFreq = both[i].frequency;
        }
      }
      return maxFreq;
    }
  }, {
    key: 'getMFCC',
    value: function getMFCC(fftBins, sampleRate, lowCutoff, highCutoff) {
      // Construct an MFCC with the characteristics we desire
      var mfcc = new MFCC(fftBins.length, // Number of expected FFT magnitudes
      42, // Number of Mel filter banks
      lowCutoff, // Low frequency cutoff
      highCutoff, // High frequency cutoff
      sampleRate); // Sample Rate
      // Run our MFCC on the FFT magnitudes
      var coef = mfcc.process(fftBins);
      return coef;
    }
  }, {
    key: 'getMaxAmplitude',
    value: function getMaxAmplitude(fftBins, sampleRate) {
      var fft = new FourierTransform(fftBins.length * 2, 44100);
      var both = fftBins.map(function (bin, index) {
        return {
          frequency: fft.getBandFrequency(index),
          magnitude: bin
        };
      });
      var max = 0;
      var length = both.length;
      for (var i = 1; i < length; i++) {
        // multiply spectrum by a zoom value
        var mag = both[i].magnitude;
        if (mag > max) {
          max = mag;
        }
      }
      return max;
    }
  }, {
    key: 'getSpectralCentroid',
    value: function getSpectralCentroid(fftBins, sampleRate) {
      var fft = new FourierTransform(fftBins.length * 2, 44100);
      var both = fftBins.map(function (bin, index) {
        return {
          frequency: fft.getBandFrequency(index),
          magnitude: bin
        };
      });
      var ampTotal = 0;
      var length = both.length;
      for (var i = 1; i < length; i++) {
        ampTotal += Math.pow(both[i].magnitude, 2);
      }

      var centroid = 0;
      for (var _i2 = 1; _i2 < length; _i2++) {
        centroid += both[_i2].frequency * Math.pow(both[_i2].magnitude, 2);
      }
      centroid /= ampTotal;
      return centroid;
    }
  }, {
    key: 'getSpectralSpread',
    value: function getSpectralSpread(fftBins, centroid) {
      var fft = new FourierTransform(fftBins.length * 2, 44100);
      var both = fftBins.map(function (bin, index) {
        return {
          frequency: fft.getBandFrequency(index),
          magnitude: bin
        };
      });

      var ampTotal = 0;
      var length = both.length;
      for (var i = 1; i < length; i++) {
        ampTotal += Math.pow(both[i].magnitude, 2);
      }

      var spread = 0;
      for (var _i3 = 1; _i3 < length; _i3++) {
        spread += Math.pow(both[_i3].frequency - centroid, 2) * Math.pow(both[_i3].magnitude, 2);
      }
      spread /= ampTotal;
      return spread;
    }
  }, {
    key: 'getSpectralFlatness',
    value: function getSpectralFlatness(fftBins, frequencies, sampleRate) {
      var fft = new dsp.FourierTransform(fftBins.length * 2, 44100);
      var both = fftBins.map(function (bin, index) {
        return {
          frequency: fft.getBandFrequency(index),
          magnitude: bin
        };
      });
      var top = 0;
      var bottom = 0;

      var length = frequencies.length;

      for (var i = 1; i < length; i++) {
        top += Math.log(both[i].magnitude);
        bottom += both[i].magnitude;
      }

      top = Math.exp(top / length);
      bottom /= length;
      return top / bottom;
    }
  }, {
    key: 'calculateOutputVariance',
    value: function calculateOutputVariance(spectrum) {
      var _this = this;

      var freqVariance = [];
      var spectralCentroidVariance = [];
      _lodash2.default.forEach(spectrum, function (window) {
        var freq = _this.getMaxFrequency(window, 44100);
        if (isNaN(freq)) {
          freq = 0;
        }
        freqVariance.push(freq);
        var centroid = _this.getSpectralCentroid(window, 44100);
        if (isNaN(centroid)) {
          centroid = 0;
        }
        spectralCentroidVariance.push(centroid);
      });
      return [(0, _computeVariance2.default)(freqVariance), (0, _computeVariance2.default)(spectralCentroidVariance)];
    }
  }, {
    key: 'getAudioSegment',
    value: function getAudioSegment(audioBuffer, segSize) {
      var length = audioBuffer.length;
      var startPosition = Math.floor((length - segSize) / 2);
      var newSegment = [];
      var endPosition = startPosition + segSize;
      for (var i = startPosition; i < endPosition; i++) {
        newSegment.push(audioBuffer[i]);
      }
      return newSegment;
    }
  }, {
    key: 'createFades',
    value: function createFades(audioBuffer, fadeLength) {
      var bufferLength = audioBuffer.length;
      for (var i = 0; i < fadeLength; i++) {
        var multiplier = (Math.exp(i / fadeLength) - 1) / (Math.E - 1);
        audioBuffer[i] *= multiplier;
      }
      for (var _i4 = bufferLength - fadeLength; _i4 < bufferLength; _i4++) {
        var j = Math.abs(_i4 - bufferLength + 1);
        var _multiplier = (Math.exp(j / fadeLength) - 1) / (Math.E - 1);
        audioBuffer[_i4] *= _multiplier;
      }
    }
  }, {
    key: 'zoomFFTBins',
    value: function zoomFFTBins(spectrum) {
      var maxValue = 0;
      var spectrumSize = spectrum.length;
      for (var i = 1; i < spectrumSize; i++) {
        // multiply spectrum by a zoom value
        var magnitude = spectrum[i];
        if (magnitude > maxValue) {
          maxValue = magnitude;
        }
      }
      var zoomedData = [];
      zoomedData[0] = 0;
      for (var sample = 1; sample < spectrumSize; sample++) {
        var perc = spectrum[sample] / maxValue;
        if (isNaN(perc)) {
          perc = 0;
        }
        zoomedData[sample] = perc;
      }
      return zoomedData;
    }
  }, {
    key: 'highResAnalysis',
    value: function highResAnalysis(fftBins, freqRange, sampleRate, threshold) {

      fftBins = fftBins.slice(0, fftBins.length / 2);
      var freqPeaks = [];
      var pointer = 0;
      for (var bin = 2; bin < fftBins.length; bin++) {
        if (fftBins[bin] < pointer) {
          if (pointer - fftBins[bin] > threshold) {
            pointer = 0;
            freqPeaks.push(freqRange[bin - 1]);
          }
        } else {
          pointer = fftBins[bin];
        }
      }
      return freqPeaks;
    }
  }]);

  return DSP;
}();

// Fourier Transform Module used by DFT, FFT, RFFT


exports.default = DSP;

var FourierTransform = function () {
  function FourierTransform(bufferSize, sampleRate) {
    _classCallCheck(this, FourierTransform);

    this.bufferSize = bufferSize;
    this.sampleRate = sampleRate;
    this.bandwidth = 2 / bufferSize * sampleRate / 2;

    this.spectrum = new Float64Array(bufferSize / 2);
    this.real = new Float64Array(bufferSize);
    this.imag = new Float64Array(bufferSize);

    this.peakBand = 0;
    this.peak = 0;
  }
  /**
   * Calculates the *middle* frequency of an FFT band.
   *
   * @param {Number} index The index of the FFT band.
   *
   * @returns The middle frequency in Hz.
   */


  _createClass(FourierTransform, [{
    key: 'getBandFrequency',
    value: function getBandFrequency(index) {
      return this.bandwidth * index + this.bandwidth / 2;
    }
  }, {
    key: 'calculateSpectrum',
    value: function calculateSpectrum() {
      var spectrum = this.spectrum,
          real = this.real,
          imag = this.imag,
          bSi = 2 / this.bufferSize,
          sqrt = Math.sqrt,
          rval,
          ival,
          mag;

      for (var i = 0, N = bufferSize / 2; i < N; i++) {
        rval = real[i];
        ival = imag[i];
        mag = bSi * sqrt(rval * rval + ival * ival);

        if (mag > this.peak) {
          this.peakBand = i;
          this.peak = mag;
        }

        spectrum[i] = mag;
      }
    }
  }]);

  return FourierTransform;
}();

/**
 * DFT is a class for calculating the Discrete Fourier Transform of a signal.
 *
 * @param {Number} bufferSize The size of the sample buffer to be computed
 * @param {Number} sampleRate The sampleRate of the buffer (eg. 44100)
 *
 * @constructor
 */


var DFT = function (_FourierTransform) {
  _inherits(DFT, _FourierTransform);

  function DFT(bufferSize, sampleRate) {
    _classCallCheck(this, DFT);

    var _this2 = _possibleConstructorReturn(this, (DFT.__proto__ || Object.getPrototypeOf(DFT)).call(this, bufferSize, sampleRate));
    // Calls FourierTransform super.


    var N = bufferSize / 2 * bufferSize;
    var TWO_PI = 2 * Math.PI;
    _this2.sinTable = new Float64Array(N);
    _this2.cosTable = new Float64Array(N);
    for (var i = 0; i < N; i++) {
      _this2.sinTable[i] = Math.sin(i * TWO_PI / bufferSize);
      _this2.cosTable[i] = Math.cos(i * TWO_PI / bufferSize);
    }
    return _this2;
  }
  /**
   * Performs a forward transform on the sample buffer.
   * Converts a time domain signal to frequency domain spectra.
   *
   * @param {Array} buffer The sample buffer. Buffer Length must be power of 2
   *
   * @returns The frequency spectrum array
   */


  _createClass(DFT, [{
    key: 'forward',
    value: function forward(buffer) {
      var real = this.real,
          imag = this.imag,
          rval,
          ival;

      for (var k = 0; k < this.bufferSize / 2; k++) {
        rval = 0.0;
        ival = 0.0;

        for (var n = 0; n < buffer.length; n++) {
          rval += this.cosTable[k * n] * buffer[n];
          ival += this.sinTable[k * n] * buffer[n];
        }

        real[k] = rval;
        imag[k] = ival;
      }
      // From super class.
      return this.calculateSpectrum();
    }
  }]);

  return DFT;
}(FourierTransform);

/**
 * FFT is a class for calculating the Discrete Fourier Transform of a signal
 * with the Fast Fourier Transform algorithm.
 *
 * @param {Number} bufferSize The size of the sample buffer to be computed. Must be power of 2
 * @param {Number} sampleRate The sampleRate of the buffer (eg. 44100)
 *
 * @constructor
 */


var FFT = function (_FourierTransform2) {
  _inherits(FFT, _FourierTransform2);

  function FFT(bufferSize, sampleRate) {
    _classCallCheck(this, FFT);

    var _this3 = _possibleConstructorReturn(this, (FFT.__proto__ || Object.getPrototypeOf(FFT)).call(this, bufferSize, sampleRate));
    // Calls FourierTransform super.


    _this3.reverseTable = new Uint32Array(bufferSize);
    var limit = 1;
    var bit = bufferSize >> 1;
    var i;
    while (limit < bufferSize) {
      for (i = 0; i < limit; i++) {
        _this3.reverseTable[i + limit] = _this3.reverseTable[i] + bit;
      }

      limit = limit << 1;
      bit = bit >> 1;
    }
    _this3.sinTable = new Float64Array(bufferSize);
    _this3.cosTable = new Float64Array(bufferSize);
    for (i = 0; i < bufferSize; i++) {
      _this3.sinTable[i] = Math.sin(-Math.PI / i);
      _this3.cosTable[i] = Math.cos(-Math.PI / i);
    }
    return _this3;
  }
  /**
   * Performs a forward transform on the sample buffer.
   * Converts a time domain signal to frequency domain spectra.
   *
   * @param {Array} buffer The sample buffer. Buffer Length must be power of 2
   *
   * @returns The frequency spectrum array
   */


  _createClass(FFT, [{
    key: 'forward',
    value: function forward(buffer) {
      // Locally scope variables for speed up
      var bufferSize = this.bufferSize,
          cosTable = this.cosTable,
          sinTable = this.sinTable,
          reverseTable = this.reverseTable,
          real = this.real,
          imag = this.imag,
          spectrum = this.spectrum;

      var k = Math.floor(Math.log(bufferSize) / Math.LN2);

      if (Math.pow(2, k) !== bufferSize) {
        throw "Invalid buffer size, must be a power of 2.";
      }
      if (bufferSize !== buffer.length) {
        throw "Supplied buffer is not the same size as defined FFT. FFT Size: " + bufferSize + " Buffer Size: " + buffer.length;
      }

      var halfSize = 1,
          phaseShiftStepReal,
          phaseShiftStepImag,
          currentPhaseShiftReal,
          currentPhaseShiftImag,
          off,
          tr,
          ti,
          tmpReal,
          i;

      for (i = 0; i < bufferSize; i++) {
        real[i] = buffer[reverseTable[i]];
        imag[i] = 0;
      }

      while (halfSize < bufferSize) {
        //phaseShiftStepReal = Math.cos(-Math.PI/halfSize);
        //phaseShiftStepImag = Math.sin(-Math.PI/halfSize);
        phaseShiftStepReal = cosTable[halfSize];
        phaseShiftStepImag = sinTable[halfSize];

        currentPhaseShiftReal = 1;
        currentPhaseShiftImag = 0;

        for (var fftStep = 0; fftStep < halfSize; fftStep++) {
          i = fftStep;

          while (i < bufferSize) {
            off = i + halfSize;
            tr = currentPhaseShiftReal * real[off] - currentPhaseShiftImag * imag[off];
            ti = currentPhaseShiftReal * imag[off] + currentPhaseShiftImag * real[off];

            real[off] = real[i] - tr;
            imag[off] = imag[i] - ti;
            real[i] += tr;
            imag[i] += ti;

            i += halfSize << 1;
          }

          tmpReal = currentPhaseShiftReal;
          currentPhaseShiftReal = tmpReal * phaseShiftStepReal - currentPhaseShiftImag * phaseShiftStepImag;
          currentPhaseShiftImag = tmpReal * phaseShiftStepImag + currentPhaseShiftImag * phaseShiftStepReal;
        }

        halfSize = halfSize << 1;
      }

      return this.calculateSpectrum();
    }
  }, {
    key: 'inverse',
    value: function inverse(real, imag) {
      // Locally scope variables for speed up
      var bufferSize = this.bufferSize,
          cosTable = this.cosTable,
          sinTable = this.sinTable,
          reverseTable = this.reverseTable,
          spectrum = this.spectrum;

      real = real || this.real;
      imag = imag || this.imag;

      var halfSize = 1,
          phaseShiftStepReal,
          phaseShiftStepImag,
          currentPhaseShiftReal,
          currentPhaseShiftImag,
          off,
          tr,
          ti,
          tmpReal,
          i;

      for (i = 0; i < bufferSize; i++) {
        imag[i] *= -1;
      }

      var revReal = new Float64Array(bufferSize);
      var revImag = new Float64Array(bufferSize);

      for (i = 0; i < real.length; i++) {
        revReal[i] = real[reverseTable[i]];
        revImag[i] = imag[reverseTable[i]];
      }

      real = revReal;
      imag = revImag;

      while (halfSize < bufferSize) {
        phaseShiftStepReal = cosTable[halfSize];
        phaseShiftStepImag = sinTable[halfSize];
        currentPhaseShiftReal = 1;
        currentPhaseShiftImag = 0;

        for (var fftStep = 0; fftStep < halfSize; fftStep++) {
          i = fftStep;

          while (i < bufferSize) {
            off = i + halfSize;
            tr = currentPhaseShiftReal * real[off] - currentPhaseShiftImag * imag[off];
            ti = currentPhaseShiftReal * imag[off] + currentPhaseShiftImag * real[off];

            real[off] = real[i] - tr;
            imag[off] = imag[i] - ti;
            real[i] += tr;
            imag[i] += ti;

            i += halfSize << 1;
          }

          tmpReal = currentPhaseShiftReal;
          currentPhaseShiftReal = tmpReal * phaseShiftStepReal - currentPhaseShiftImag * phaseShiftStepImag;
          currentPhaseShiftImag = tmpReal * phaseShiftStepImag + currentPhaseShiftImag * phaseShiftStepReal;
        }

        halfSize = halfSize << 1;
      }

      var buffer = new Float64Array(bufferSize); // this should be reused instead
      for (i = 0; i < bufferSize; i++) {
        buffer[i] = real[i] / bufferSize;
      }

      return buffer;
    }
  }]);

  return FFT;
}(FourierTransform);

/**
 * RFFT is a class for calculating the Discrete Fourier Transform of a signal
 * with the Fast Fourier Transform algorithm.
 *
 * This method currently only contains a forward transform but is highly optimized.
 *
 * @param {Number} bufferSize The size of the sample buffer to be computed. Must be power of 2
 * @param {Number} sampleRate The sampleRate of the buffer (eg. 44100)
 *
 * @constructor
 */

// lookup tables don't really gain us any speed, but they do increase
// cache footprint, so don't use them in here

// also we don't use sepearate arrays for real/imaginary parts

// this one a little more than twice as fast as the one in FFT
// however I only did the forward transform

// the rest of this was translated from C, see http://www.jjj.de/fxt/
// this is the real split radix FFT

var RFFT = function (_FourierTransform3) {
  _inherits(RFFT, _FourierTransform3);

  function RFFT(bufferSize, sampleRate) {
    _classCallCheck(this, RFFT);

    var _this4 = _possibleConstructorReturn(this, (RFFT.__proto__ || Object.getPrototypeOf(RFFT)).call(this, bufferSize, sampleRate));

    _this4.trans = new Float64Array(bufferSize);
    _this4.reverseTable = new Uint32Array(bufferSize);
    _this4.generateReverseTable();
    return _this4;
  }

  // don't use a lookup table to do the permute, use this instead


  _createClass(RFFT, [{
    key: 'reverseBinPermute',
    value: function reverseBinPermute(dest, source) {
      var bufferSize = this.bufferSize,
          halfSize = bufferSize >>> 1,
          nm1 = bufferSize - 1,
          i = 1,
          r = 0,
          h;

      dest[0] = source[0];

      do {
        r += halfSize;
        dest[i] = source[r];
        dest[r] = source[i];

        i++;

        h = halfSize << 1;
        while (h = h >> 1, !((r ^= h) & h)) {}

        if (r >= i) {
          dest[i] = source[r];
          dest[r] = source[i];

          dest[nm1 - i] = source[nm1 - r];
          dest[nm1 - r] = source[nm1 - i];
        }
        i++;
      } while (i < halfSize);
      dest[nm1] = source[nm1];
    }
  }, {
    key: 'generateReverseTable',
    value: function generateReverseTable() {
      var bufferSize = this.bufferSize,
          halfSize = bufferSize >>> 1,
          nm1 = bufferSize - 1,
          i = 1,
          r = 0,
          h;

      this.reverseTable[0] = 0;

      do {
        r += halfSize;

        this.reverseTable[i] = r;
        this.reverseTable[r] = i;

        i++;

        h = halfSize << 1;
        while (h = h >> 1, !((r ^= h) & h)) {}

        if (r >= i) {
          this.reverseTable[i] = r;
          this.reverseTable[r] = i;

          this.reverseTable[nm1 - i] = nm1 - r;
          this.reverseTable[nm1 - r] = nm1 - i;
        }
        i++;
      } while (i < halfSize);
      this.reverseTable[nm1] = nm1;
    }

    // Ordering of output:
    //
    // trans[0]     = re[0] (==zero frequency, purely real)
    // trans[1]     = re[1]
    //             ...
    // trans[n/2-1] = re[n/2-1]
    // trans[n/2]   = re[n/2]    (==nyquist frequency, purely real)
    //
    // trans[n/2+1] = im[n/2-1]
    // trans[n/2+2] = im[n/2-2]
    //             ...
    // trans[n-1]   = im[1] 

  }, {
    key: 'forward',
    value: function forward(buffer) {
      var n = this.bufferSize,
          spectrum = this.spectrum,
          x = this.trans,
          TWO_PI = 2 * Math.PI,
          sqrt = Math.sqrt,
          i = n >>> 1,
          bSi = 2 / n,
          n2,
          n4,
          n8,
          nn,
          t1,
          t2,
          t3,
          t4,
          i1,
          i2,
          i3,
          i4,
          i5,
          i6,
          i7,
          i8,
          st1,
          cc1,
          ss1,
          cc3,
          ss3,
          e,
          a,
          rval,
          ival,
          mag;

      this.reverseBinPermute(x, buffer);

      for (var ix = 0, id = 4; ix < n; id *= 4) {
        for (var i0 = ix; i0 < n; i0 += id) {
          //sumdiff(x[i0], x[i0+1]); // {a, b}  <--| {a+b, a-b}
          st1 = x[i0] - x[i0 + 1];
          x[i0] += x[i0 + 1];
          x[i0 + 1] = st1;
        }
        ix = 2 * (id - 1);
      }

      n2 = 2;
      nn = n >>> 1;

      while (nn = nn >>> 1) {
        ix = 0;
        n2 = n2 << 1;
        id = n2 << 1;
        n4 = n2 >>> 2;
        n8 = n2 >>> 3;
        do {
          if (n4 !== 1) {
            for (i0 = ix; i0 < n; i0 += id) {
              i1 = i0;
              i2 = i1 + n4;
              i3 = i2 + n4;
              i4 = i3 + n4;

              //diffsum3_r(x[i3], x[i4], t1); // {a, b, s} <--| {a, b-a, a+b}
              t1 = x[i3] + x[i4];
              x[i4] -= x[i3];
              //sumdiff3(x[i1], t1, x[i3]);   // {a, b, d} <--| {a+b, b, a-b}
              x[i3] = x[i1] - t1;
              x[i1] += t1;

              i1 += n8;
              i2 += n8;
              i3 += n8;
              i4 += n8;

              //sumdiff(x[i3], x[i4], t1, t2); // {s, d}  <--| {a+b, a-b}
              t1 = x[i3] + x[i4];
              t2 = x[i3] - x[i4];

              t1 = -t1 * Math.SQRT1_2;
              t2 *= Math.SQRT1_2;

              // sumdiff(t1, x[i2], x[i4], x[i3]); // {s, d}  <--| {a+b, a-b}
              st1 = x[i2];
              x[i4] = t1 + st1;
              x[i3] = t1 - st1;

              //sumdiff3(x[i1], t2, x[i2]); // {a, b, d} <--| {a+b, b, a-b}
              x[i2] = x[i1] - t2;
              x[i1] += t2;
            }
          } else {
            for (i0 = ix; i0 < n; i0 += id) {
              i1 = i0;
              i2 = i1 + n4;
              i3 = i2 + n4;
              i4 = i3 + n4;

              //diffsum3_r(x[i3], x[i4], t1); // {a, b, s} <--| {a, b-a, a+b}
              t1 = x[i3] + x[i4];
              x[i4] -= x[i3];

              //sumdiff3(x[i1], t1, x[i3]);   // {a, b, d} <--| {a+b, b, a-b}
              x[i3] = x[i1] - t1;
              x[i1] += t1;
            }
          }

          ix = (id << 1) - n2;
          id = id << 2;
        } while (ix < n);

        e = TWO_PI / n2;

        for (var j = 1; j < n8; j++) {
          a = j * e;
          ss1 = Math.sin(a);
          cc1 = Math.cos(a);

          //ss3 = sin(3*a); cc3 = cos(3*a);
          cc3 = 4 * cc1 * (cc1 * cc1 - 0.75);
          ss3 = 4 * ss1 * (0.75 - ss1 * ss1);

          ix = 0;id = n2 << 1;
          do {
            for (i0 = ix; i0 < n; i0 += id) {
              i1 = i0 + j;
              i2 = i1 + n4;
              i3 = i2 + n4;
              i4 = i3 + n4;

              i5 = i0 + n4 - j;
              i6 = i5 + n4;
              i7 = i6 + n4;
              i8 = i7 + n4;

              //cmult(c, s, x, y, &u, &v)
              //cmult(cc1, ss1, x[i7], x[i3], t2, t1); // {u,v} <--| {x*c-y*s, x*s+y*c}
              t2 = x[i7] * cc1 - x[i3] * ss1;
              t1 = x[i7] * ss1 + x[i3] * cc1;

              //cmult(cc3, ss3, x[i8], x[i4], t4, t3);
              t4 = x[i8] * cc3 - x[i4] * ss3;
              t3 = x[i8] * ss3 + x[i4] * cc3;

              //sumdiff(t2, t4);   // {a, b} <--| {a+b, a-b}
              st1 = t2 - t4;
              t2 += t4;
              t4 = st1;

              //sumdiff(t2, x[i6], x[i8], x[i3]); // {s, d}  <--| {a+b, a-b}
              //st1 = x[i6]; x[i8] = t2 + st1; x[i3] = t2 - st1;
              x[i8] = t2 + x[i6];
              x[i3] = t2 - x[i6];

              //sumdiff_r(t1, t3); // {a, b} <--| {a+b, b-a}
              st1 = t3 - t1;
              t1 += t3;
              t3 = st1;

              //sumdiff(t3, x[i2], x[i4], x[i7]); // {s, d}  <--| {a+b, a-b}
              //st1 = x[i2]; x[i4] = t3 + st1; x[i7] = t3 - st1;
              x[i4] = t3 + x[i2];
              x[i7] = t3 - x[i2];

              //sumdiff3(x[i1], t1, x[i6]);   // {a, b, d} <--| {a+b, b, a-b}
              x[i6] = x[i1] - t1;
              x[i1] += t1;

              //diffsum3_r(t4, x[i5], x[i2]); // {a, b, s} <--| {a, b-a, a+b}
              x[i2] = t4 + x[i5];
              x[i5] -= t4;
            }

            ix = (id << 1) - n2;
            id = id << 2;
          } while (ix < n);
        }
      }

      while (--i) {
        rval = x[i];
        ival = x[n - i - 1];
        mag = bSi * sqrt(rval * rval + ival * ival);

        if (mag > this.peak) {
          this.peakBand = i;
          this.peak = mag;
        }

        spectrum[i] = mag;
      }

      spectrum[0] = bSi * x[0];

      return spectrum;
    }
  }]);

  return RFFT;
}(FourierTransform);

var ParallelRFFT = function ParallelRFFT(buffer) {

  var bufferSize = buffer.length;
  var n = bufferSize,
      spectrum = new Float64Array(bufferSize / 2),
      x = new Float64Array(bufferSize),
      TWO_PI = 2 * Math.PI,
      sqrt = Math.sqrt,
      i = n >>> 1,
      bSi = 2 / n,
      n2,
      n4,
      n8,
      nn,
      t1,
      t2,
      t3,
      t4,
      i1,
      i2,
      i3,
      i4,
      i5,
      i6,
      i7,
      i8,
      st1,
      cc1,
      ss1,
      cc3,
      ss3,
      e,
      a,
      rval,
      ival,
      mag;
  peakBand = 0, peak = 0;

  var bufferSize = bufferSize,
      halfSize = bufferSize >>> 1,
      nm1 = bufferSize - 1,
      i = 1,
      r = 0,
      h;

  x[0] = buffer[0];

  do {
    r += halfSize;
    x[i] = buffer[r];
    x[r] = buffer[i];

    i++;

    h = halfSize << 1;
    while (h = h >> 1, !((r ^= h) & h)) {}

    if (r >= i) {
      x[i] = buffer[r];
      x[r] = buffer[i];

      x[nm1 - i] = buffer[nm1 - r];
      x[nm1 - r] = buffer[nm1 - i];
    }
    i++;
  } while (i < halfSize);
  x[nm1] = buffer[nm1];

  for (var ix = 0, id = 4; ix < n; id *= 4) {
    for (var i0 = ix; i0 < n; i0 += id) {
      //sumdiff(x[i0], x[i0+1]); // {a, b}  <--| {a+b, a-b}
      st1 = x[i0] - x[i0 + 1];
      x[i0] += x[i0 + 1];
      x[i0 + 1] = st1;
    }
    ix = 2 * (id - 1);
  }

  n2 = 2;
  nn = n >>> 1;

  while (nn = nn >>> 1) {
    ix = 0;
    n2 = n2 << 1;
    id = n2 << 1;
    n4 = n2 >>> 2;
    n8 = n2 >>> 3;
    do {
      if (n4 !== 1) {
        for (i0 = ix; i0 < n; i0 += id) {
          i1 = i0;
          i2 = i1 + n4;
          i3 = i2 + n4;
          i4 = i3 + n4;

          //diffsum3_r(x[i3], x[i4], t1); // {a, b, s} <--| {a, b-a, a+b}
          t1 = x[i3] + x[i4];
          x[i4] -= x[i3];
          //sumdiff3(x[i1], t1, x[i3]);   // {a, b, d} <--| {a+b, b, a-b}
          x[i3] = x[i1] - t1;
          x[i1] += t1;

          i1 += n8;
          i2 += n8;
          i3 += n8;
          i4 += n8;

          //sumdiff(x[i3], x[i4], t1, t2); // {s, d}  <--| {a+b, a-b}
          t1 = x[i3] + x[i4];
          t2 = x[i3] - x[i4];

          t1 = -t1 * Math.SQRT1_2;
          t2 *= Math.SQRT1_2;

          // sumdiff(t1, x[i2], x[i4], x[i3]); // {s, d}  <--| {a+b, a-b}
          st1 = x[i2];
          x[i4] = t1 + st1;
          x[i3] = t1 - st1;

          //sumdiff3(x[i1], t2, x[i2]); // {a, b, d} <--| {a+b, b, a-b}
          x[i2] = x[i1] - t2;
          x[i1] += t2;
        }
      } else {
        for (i0 = ix; i0 < n; i0 += id) {
          i1 = i0;
          i2 = i1 + n4;
          i3 = i2 + n4;
          i4 = i3 + n4;

          //diffsum3_r(x[i3], x[i4], t1); // {a, b, s} <--| {a, b-a, a+b}
          t1 = x[i3] + x[i4];
          x[i4] -= x[i3];

          //sumdiff3(x[i1], t1, x[i3]);   // {a, b, d} <--| {a+b, b, a-b}
          x[i3] = x[i1] - t1;
          x[i1] += t1;
        }
      }

      ix = (id << 1) - n2;
      id = id << 2;
    } while (ix < n);

    e = TWO_PI / n2;

    for (var j = 1; j < n8; j++) {
      a = j * e;
      ss1 = Math.sin(a);
      cc1 = Math.cos(a);

      //ss3 = sin(3*a); cc3 = cos(3*a);
      cc3 = 4 * cc1 * (cc1 * cc1 - 0.75);
      ss3 = 4 * ss1 * (0.75 - ss1 * ss1);

      ix = 0;id = n2 << 1;
      do {
        for (i0 = ix; i0 < n; i0 += id) {
          i1 = i0 + j;
          i2 = i1 + n4;
          i3 = i2 + n4;
          i4 = i3 + n4;

          i5 = i0 + n4 - j;
          i6 = i5 + n4;
          i7 = i6 + n4;
          i8 = i7 + n4;

          //cmult(c, s, x, y, &u, &v)
          //cmult(cc1, ss1, x[i7], x[i3], t2, t1); // {u,v} <--| {x*c-y*s, x*s+y*c}
          t2 = x[i7] * cc1 - x[i3] * ss1;
          t1 = x[i7] * ss1 + x[i3] * cc1;

          //cmult(cc3, ss3, x[i8], x[i4], t4, t3);
          t4 = x[i8] * cc3 - x[i4] * ss3;
          t3 = x[i8] * ss3 + x[i4] * cc3;

          //sumdiff(t2, t4);   // {a, b} <--| {a+b, a-b}
          st1 = t2 - t4;
          t2 += t4;
          t4 = st1;

          //sumdiff(t2, x[i6], x[i8], x[i3]); // {s, d}  <--| {a+b, a-b}
          //st1 = x[i6]; x[i8] = t2 + st1; x[i3] = t2 - st1;
          x[i8] = t2 + x[i6];
          x[i3] = t2 - x[i6];

          //sumdiff_r(t1, t3); // {a, b} <--| {a+b, b-a}
          st1 = t3 - t1;
          t1 += t3;
          t3 = st1;

          //sumdiff(t3, x[i2], x[i4], x[i7]); // {s, d}  <--| {a+b, a-b}
          //st1 = x[i2]; x[i4] = t3 + st1; x[i7] = t3 - st1;
          x[i4] = t3 + x[i2];
          x[i7] = t3 - x[i2];

          //sumdiff3(x[i1], t1, x[i6]);   // {a, b, d} <--| {a+b, b, a-b}
          x[i6] = x[i1] - t1;
          x[i1] += t1;

          //diffsum3_r(t4, x[i5], x[i2]); // {a, b, s} <--| {a, b-a, a+b}
          x[i2] = t4 + x[i5];
          x[i5] -= t4;
        }

        ix = (id << 1) - n2;
        id = id << 2;
      } while (ix < n);
    }
  }

  while (--i) {
    rval = x[i];
    ival = x[n - i - 1];
    mag = bSi * sqrt(rval * rval + ival * ival);

    if (mag > peak) {
      peakBand = i;
      peak = mag;
    }

    spectrum[i] = mag;
  }

  spectrum[0] = bSi * x[0];

  return spectrum;
};

/**
 * Oscillator class for generating and modifying signals
 *
 * @param {Number} type       A waveform constant (eg. OSC_SINE)
 * @param {Number} frequency  Initial frequency of the signal
 * @param {Number} amplitude  Initial amplitude of the signal
 * @param {Number} bufferSize Size of the sample buffer to generate
 * @param {Number} sampleRate The sample rate of the signal
 *
 * @contructor
 */

var Oscillator = function () {
  function Oscillator(type, frequency, amplitude, bufferSize, sampleRate) {
    _classCallCheck(this, Oscillator);

    this.frequency = frequency;
    this.amplitude = amplitude;
    this.bufferSize = bufferSize;
    this.sampleRate = sampleRate;
    //this.pulseWidth = pulseWidth;
    this.frameCount = 0;

    this.waveTableLength = 2048;

    this.cyclesPerSample = frequency / sampleRate;

    this.signal = new Float64Array(bufferSize);
    this.envelope = null;

    switch (parseInt(type, 10)) {
      case types.waveforms.OSC_TRIANGLE:
        this.func = function (step) {
          return 1 - 4 * Math.abs(Math.round(step) - step);
        };
        break;

      case types.waveforms.OSC_SAW:
        this.func = function (step) {
          return 2 * (step - Math.round(step));
        };
        break;

      case types.waveforms.OSC_SQUARE:
        this.func = function (step) {
          return step < 0.5 ? 1 : -1;
        };
        break;
      case types.waveforms.FLAT:
        this.func = function (step) {
          return this.frequency;
        };
        break;
      default:
      case types.waveforms.OSC_SINE:
        this.func = function (step) {
          return Math.sin(TWO_PI * step);
        };
        break;
    }

    if (typeof Oscillator.waveTable === 'undefined') {
      Oscillator.waveTable = {};
    }

    if (typeof Oscillator.waveTable[this.func] === 'undefined') {
      this.generateWaveTable();
    }

    this.waveTable = Oscillator.waveTable[this.func];
  }

  _createClass(Oscillator, [{
    key: 'generateWaveTable',
    value: function generateWaveTable() {
      Oscillator.waveTable[this.func] = new Float64Array(2048);
      var waveTableTime = this.waveTableLength / this.sampleRate;
      var waveTableHz = 1 / waveTableTime;

      for (var i = 0; i < this.waveTableLength; i++) {
        Oscillator.waveTable[this.func][i] = this.func(i * waveTableHz / this.sampleRate);
      }
    }

    /**
     * Set the amplitude of the signal
     *
     * @param {Number} amplitude The amplitude of the signal (between 0 and 1)
     */

  }, {
    key: 'setAmp',
    value: function setAmp(amplitude) {
      if (amplitude >= 0 && amplitude <= 1) {
        this.amplitude = amplitude;
      } else {
        throw "Amplitude out of range (0..1).";
      }
    }

    /**
     * Set the frequency of the signal
     *
     * @param {Number} frequency The frequency of the signal
     */

  }, {
    key: 'setFreq',
    value: function setFreq(frequency) {
      this.frequency = frequency;
      this.cyclesPerSample = frequency / this.sampleRate;
    }
  }, {
    key: 'add',


    // Add an oscillator
    value: function add(oscillator) {
      for (var i = 0; i < this.bufferSize; i++) {
        //this.signal[i] += oscillator.valueAt(i);
        this.signal[i] += oscillator.signal[i];
      }

      return this.signal;
    }
  }, {
    key: 'addSignal',


    // Add a signal to the current generated osc signal
    value: function addSignal(signal) {
      for (var i = 0; i < signal.length; i++) {
        if (i >= this.bufferSize) {
          break;
        }
        this.signal[i] += signal[i];

        /*
        // Constrain amplitude
        if ( this.signal[i] > 1 ) {
          this.signal[i] = 1;
        } else if ( this.signal[i] < -1 ) {
          this.signal[i] = -1;
        }
        */
      }
      return this.signal;
    }
  }, {
    key: 'addEnvelope',


    // Add an envelope to the oscillator
    value: function addEnvelope(envelope) {
      this.envelope = envelope;
    }
  }, {
    key: 'applyEnvelope',
    value: function applyEnvelope() {
      this.envelope.process(this.signal);
    }
  }, {
    key: 'valueAt',
    value: function valueAt(offset) {
      return this.waveTable[offset % this.waveTableLength];
    }
  }, {
    key: 'generate',
    value: function generate() {
      var frameOffset = this.frameCount * this.bufferSize;
      var step = this.waveTableLength * this.frequency / this.sampleRate;
      var offset;

      for (var i = 0; i < this.bufferSize; i++) {
        //var step = (frameOffset + i) * this.cyclesPerSample % 1;
        //this.signal[i] = this.func(step) * this.amplitude;
        //this.signal[i] = this.valueAt(Math.round((frameOffset + i) * step)) * this.amplitude;
        offset = Math.round((frameOffset + i) * step);
        this.signal[i] = this.waveTable[offset % this.waveTableLength] * this.amplitude;
      }

      this.frameCount++;

      return this.signal;
    }
  }]);

  return Oscillator;
}();

var WindowFunction = function () {
  function WindowFunction(type, alpha) {
    _classCallCheck(this, WindowFunction);

    this.alpha = alpha;

    switch (type) {
      case types.windowFunctions.BARTLETT:
        this.func = function (length, index) {
          return 2 / (length - 1) * ((length - 1) / 2 - Math.abs(index - (length - 1) / 2));
        };
        break;

      case types.windowFunctions.BARTLETTHANN:
        this.func = function (length, index) {
          return 0.62 - 0.48 * Math.abs(index / (length - 1) - 0.5) - 0.38 * Math.cos(TWO_PI * index / (length - 1));
        };
        break;

      case types.windowFunctions.BLACKMAN:
        this.func = function (length, index, alpha) {
          var a0 = (1 - alpha) / 2;
          var a1 = 0.5;
          var a2 = alpha / 2;

          return a0 - a1 * Math.cos(TWO_PI * index / (length - 1)) + a2 * Math.cos(4 * Math.PI * index / (length - 1));
        };
        this.alpha = this.alpha || 0.16;
        break;

      case types.windowFunctions.COSINE:
        this.func = function (length, index) {
          return Math.cos(Math.PI * index / (length - 1) - Math.PI / 2);
        };
        break;

      case types.windowFunctions.GAUSS:
        this.func = function (length, index, alpha) {
          return Math.pow(Math.E, -0.5 * Math.pow((index - (length - 1) / 2) / (alpha * (length - 1) / 2), 2));
        };
        this.alpha = this.alpha || 0.25;
        break;

      case types.windowFunctions.HAMMING:
        this.func = function (length, index) {
          return 0.54 - 0.46 * Math.cos(TWO_PI * index / (length - 1));
        };
        break;

      case types.windowFunctions.HANN:
        this.func = function (length, index) {
          return 0.5 * (1 - Math.cos(TWO_PI * index / (length - 1)));
        };
        break;

      case types.windowFunctions.LANCZOS:
        this.func = function (length, index) {
          var x = 2 * index / (length - 1) - 1;
          return Math.sin(Math.PI * x) / (Math.PI * x);
        };
        break;

      case types.windowFunctions.RECTANGULAR:
        this.func = function (length, index) {
          return 1;
        };
        break;

      case types.windowFunctions.TRIANGULAR:
        this.func = function (length, index) {
          return 2 / length * (length / 2 - Math.abs(index - (length - 1) / 2));
        };
        break;
    }
  }

  _createClass(WindowFunction, [{
    key: 'process',
    value: function process(buffer) {
      var length = buffer.length;
      for (var i = 0; i < length; i++) {
        buffer[i] *= this.func(length, i, this.alpha);
      }
      return buffer;
    }
  }]);

  return WindowFunction;
}();

/* 
 *  Biquad filter
 * 
 *  Created by Ricard Marxer <email@ricardmarxer.com> on 2010-05-23.
 *  Copyright 2010 Ricard Marxer. All rights reserved.
 *
 */
// Implementation based on:
// http://www.musicdsp.org/files/Audio-EQ-Cookbook.txt


var Biquad = function () {
  function Biquad(type, sampleRate) {
    _classCallCheck(this, Biquad);

    this.Fs = sampleRate;
    this.type = type; // type of the filter
    this.parameterType = BIQUAD_Q; // type of the parameter

    this.x_1_l = 0;
    this.x_2_l = 0;
    this.y_1_l = 0;
    this.y_2_l = 0;

    this.x_1_r = 0;
    this.x_2_r = 0;
    this.y_1_r = 0;
    this.y_2_r = 0;

    this.b0 = 1;
    this.a0 = 1;

    this.b1 = 0;
    this.a1 = 0;

    this.b2 = 0;
    this.a2 = 0;

    this.b0a0 = this.b0 / this.a0;
    this.b1a0 = this.b1 / this.a0;
    this.b2a0 = this.b2 / this.a0;
    this.a1a0 = this.a1 / this.a0;
    this.a2a0 = this.a2 / this.a0;

    this.f0 = 3000; // "wherever it's happenin', man."  Center Frequency or
    // Corner Frequency, or shelf midpoint frequency, depending
    // on which filter type.  The "significant frequency".

    this.dBgain = 12; // used only for peaking and shelving filters

    this.Q = 1; // the EE kind of definition, except for peakingEQ in which A*Q is
    // the classic EE Q.  That adjustment in definition was made so that
    // a boost of N dB followed by a cut of N dB for identical Q and
    // f0/Fs results in a precisely flat unity gain filter or "wire".

    this.BW = -3; // the bandwidth in octaves (between -3 dB frequencies for BPF
    // and notch or between midpoint (dBgain/2) gain frequencies for
    // peaking EQ

    this.S = 1; // a "shelf slope" parameter (for shelving EQ only).  When S = 1,
    // the shelf slope is as steep as it can be and remain monotonically
    // increasing or decreasing gain with frequency.  The shelf slope, in
    // dB/octave, remains proportional to S for all other values for a
    // fixed f0/Fs and dBgain.
  }

  _createClass(Biquad, [{
    key: 'coefficients',
    value: function coefficients() {
      var b = [this.b0, this.b1, this.b2];
      var a = [this.a0, this.a1, this.a2];
      return { b: b, a: a };
    }
  }, {
    key: 'setFilterType',
    value: function setFilterType(type) {
      this.type = type;
      this.recalculateCoefficients();
    }
  }, {
    key: 'setSampleRate',
    value: function setSampleRate(rate) {
      this.Fs = rate;
      this.recalculateCoefficients();
    }
  }, {
    key: 'setQ',
    value: function setQ(q) {
      this.parameterType = BIQUAD_Q;
      this.Q = Math.max(Math.min(q, 115.0), 0.001);
      this.recalculateCoefficients();
    }
  }, {
    key: 'setBW',
    value: function setBW(bw) {
      this.parameterType = BIQUAD_BW;
      this.BW = bw;
      this.recalculateCoefficients();
    }
  }, {
    key: 'setS',
    value: function setS(s) {
      this.parameterType = BIQUAD_S;
      this.S = Math.max(Math.min(s, 5.0), 0.0001);
      this.recalculateCoefficients();
    }
  }, {
    key: 'setF0',
    value: function setF0(freq) {
      this.f0 = freq;
      this.recalculateCoefficients();
    }
  }, {
    key: 'setDbGain',
    value: function setDbGain(g) {
      this.dBgain = g;
      this.recalculateCoefficients();
    }
  }, {
    key: 'recalculateCoefficients',
    value: function recalculateCoefficients() {
      var A;
      if (type === types.biquadFilters.PEAKING_EQ || type === types.biquadFilters.LOW_SHELF || type === types.biquadFilters.HIGH_SHELF) {
        A = Math.pow(10, this.dBgain / 40); // for peaking and shelving EQ filters only
      } else {
        A = Math.sqrt(Math.pow(10, this.dBgain / 20));
      }

      var w0 = TWO_PI * this.f0 / this.Fs;

      var cosw0 = Math.cos(w0);
      var sinw0 = Math.sin(w0);

      var alpha = 0;

      switch (this.parameterType) {
        case BIQUAD_Q:
          alpha = sinw0 / (2 * this.Q);
          break;

        case BIQUAD_BW:
          alpha = sinw0 * sinh(Math.LN2 / 2 * this.BW * w0 / sinw0);
          break;

        case BIQUAD_S:
          alpha = sinw0 / 2 * Math.sqrt((A + 1 / A) * (1 / this.S - 1) + 2);
          break;
      }

      /**
          FYI: The relationship between bandwidth and Q is
               1/Q = 2*sinh(ln(2)/2*BW*w0/sin(w0))     (digital filter w BLT)
          or   1/Q = 2*sinh(ln(2)/2*BW)             (analog filter prototype)
           The relationship between shelf slope and Q is
               1/Q = sqrt((A + 1/A)*(1/S - 1) + 2)
      */

      var coeff;

      switch (this.type) {
        case types.biquadFilters.LPF:
          // H(s) = 1 / (s^2 + s/Q + 1)
          this.b0 = (1 - cosw0) / 2;
          this.b1 = 1 - cosw0;
          this.b2 = (1 - cosw0) / 2;
          this.a0 = 1 + alpha;
          this.a1 = -2 * cosw0;
          this.a2 = 1 - alpha;
          break;

        case types.biquadFilters.HPF:
          // H(s) = s^2 / (s^2 + s/Q + 1)
          this.b0 = (1 + cosw0) / 2;
          this.b1 = -(1 + cosw0);
          this.b2 = (1 + cosw0) / 2;
          this.a0 = 1 + alpha;
          this.a1 = -2 * cosw0;
          this.a2 = 1 - alpha;
          break;

        case types.biquadFilters.BPF_CONSTANT_SKIRT:
          // H(s) = s / (s^2 + s/Q + 1)  (constant skirt gain, peak gain = Q)
          this.b0 = sinw0 / 2;
          this.b1 = 0;
          this.b2 = -sinw0 / 2;
          this.a0 = 1 + alpha;
          this.a1 = -2 * cosw0;
          this.a2 = 1 - alpha;
          break;

        case types.biquadFilters.BPF_CONSTANT_PEAK:
          // H(s) = (s/Q) / (s^2 + s/Q + 1)      (constant 0 dB peak gain)
          this.b0 = alpha;
          this.b1 = 0;
          this.b2 = -alpha;
          this.a0 = 1 + alpha;
          this.a1 = -2 * cosw0;
          this.a2 = 1 - alpha;
          break;

        case types.biquadFilters.NOTCH:
          // H(s) = (s^2 + 1) / (s^2 + s/Q + 1)
          this.b0 = 1;
          this.b1 = -2 * cosw0;
          this.b2 = 1;
          this.a0 = 1 + alpha;
          this.a1 = -2 * cosw0;
          this.a2 = 1 - alpha;
          break;

        case types.biquadFilters.APF:
          // H(s) = (s^2 - s/Q + 1) / (s^2 + s/Q + 1)
          this.b0 = 1 - alpha;
          this.b1 = -2 * cosw0;
          this.b2 = 1 + alpha;
          this.a0 = 1 + alpha;
          this.a1 = -2 * cosw0;
          this.a2 = 1 - alpha;
          break;

        case types.biquadFilters.PEAKING_EQ:
          // H(s) = (s^2 + s*(A/Q) + 1) / (s^2 + s/(A*Q) + 1)
          this.b0 = 1 + alpha * A;
          this.b1 = -2 * cosw0;
          this.b2 = 1 - alpha * A;
          this.a0 = 1 + alpha / A;
          this.a1 = -2 * cosw0;
          this.a2 = 1 - alpha / A;
          break;

        case types.biquadFilters.LOW_SHELF:
          // H(s) = A * (s^2 + (sqrt(A)/Q)*s + A)/(A*s^2 + (sqrt(A)/Q)*s + 1)
          coeff = sinw0 * Math.sqrt((A ^ 2 + 1) * (1 / this.S - 1) + 2 * A);
          this.b0 = A * (A + 1 - (A - 1) * cosw0 + coeff);
          this.b1 = 2 * A * (A - 1 - (A + 1) * cosw0);
          this.b2 = A * (A + 1 - (A - 1) * cosw0 - coeff);
          this.a0 = A + 1 + (A - 1) * cosw0 + coeff;
          this.a1 = -2 * (A - 1 + (A + 1) * cosw0);
          this.a2 = A + 1 + (A - 1) * cosw0 - coeff;
          break;

        case types.biquadFilters.HIGH_SHELF:
          // H(s) = A * (A*s^2 + (sqrt(A)/Q)*s + 1)/(s^2 + (sqrt(A)/Q)*s + A)
          coeff = sinw0 * Math.sqrt((A ^ 2 + 1) * (1 / this.S - 1) + 2 * A);
          this.b0 = A * (A + 1 + (A - 1) * cosw0 + coeff);
          this.b1 = -2 * A * (A - 1 + (A + 1) * cosw0);
          this.b2 = A * (A + 1 + (A - 1) * cosw0 - coeff);
          this.a0 = A + 1 - (A - 1) * cosw0 + coeff;
          this.a1 = 2 * (A - 1 - (A + 1) * cosw0);
          this.a2 = A + 1 - (A - 1) * cosw0 - coeff;
          break;
      }

      this.b0a0 = this.b0 / this.a0;
      this.b1a0 = this.b1 / this.a0;
      this.b2a0 = this.b2 / this.a0;
      this.a1a0 = this.a1 / this.a0;
      this.a2a0 = this.a2 / this.a0;
    }
  }, {
    key: 'process',
    value: function process(buffer) {
      //y[n] = (b0/a0)*x[n] + (b1/a0)*x[n-1] + (b2/a0)*x[n-2]
      //       - (a1/a0)*y[n-1] - (a2/a0)*y[n-2]

      var len = buffer.length;
      var output = new Float64Array(len);

      for (var i = 0; i < buffer.length; i++) {
        output[i] = this.b0a0 * buffer[i] + this.b1a0 * this.x_1_l + this.b2a0 * this.x_2_l - this.a1a0 * this.y_1_l - this.a2a0 * this.y_2_l;
        this.y_2_l = this.y_1_l;
        this.y_1_l = output[i];
        this.x_2_l = this.x_1_l;
        this.x_1_l = buffer[i];
      }

      return output;
    }
  }, {
    key: 'processStereo',
    value: function processStereo(buffer) {
      //y[n] = (b0/a0)*x[n] + (b1/a0)*x[n-1] + (b2/a0)*x[n-2]
      //       - (a1/a0)*y[n-1] - (a2/a0)*y[n-2]

      var len = buffer.length;
      var output = new Float64Array(len);

      for (var i = 0; i < len / 2; i++) {
        output[2 * i] = this.b0a0 * buffer[2 * i] + this.b1a0 * this.x_1_l + this.b2a0 * this.x_2_l - this.a1a0 * this.y_1_l - this.a2a0 * this.y_2_l;
        this.y_2_l = this.y_1_l;
        this.y_1_l = output[2 * i];
        this.x_2_l = this.x_1_l;
        this.x_1_l = buffer[2 * i];

        output[2 * i + 1] = this.b0a0 * buffer[2 * i + 1] + this.b1a0 * this.x_1_r + this.b2a0 * this.x_2_r - this.a1a0 * this.y_1_r - this.a2a0 * this.y_2_r;
        this.y_2_r = this.y_1_r;
        this.y_1_r = output[2 * i + 1];
        this.x_2_r = this.x_1_r;
        this.x_1_r = buffer[2 * i + 1];
      }

      return output;
    }
  }]);

  return Biquad;
}();

var CTRNNUtil = function () {
  function CTRNNUtil() {
    _classCallCheck(this, CTRNNUtil);
  }

  _createClass(CTRNNUtil, [{
    key: 'renderSample',
    value: function renderSample(ctrnn, audioBuffer, addFades) {
      var numChannels = void 0;
      var leftChannel = void 0;
      var rightChannel = void 0;

      if (typeof audioBuffer.getChannelData === 'undefined') {
        leftChannel = audioBuffer;
        numChannels = 1;
      } else {
        leftChannel = audioBuffer.getChannelData(0);
        rightChannel = audioBuffer.getChannelData(1);
        numChannels = 2;
      }

      var bufferSize = leftChannel.length;

      var total = 0;

      for (var sample = 0; sample < bufferSize; sample++) {
        // Feed input into network.
        ctrnn.feedInputs([leftChannel[sample]]);
        // Update network state.
        ctrnn.updateCTRNN();
        // Get network output.
        var outputs = ctrnn.getOutputs();
        var output = outputs[0];
        leftChannel[sample] = output;
        total += output;
      }

      // Cater for DC offset.
      var offset = total / bufferSize;
      for (var _sample2 = 0; _sample2 < bufferSize; _sample2++) {
        leftChannel[_sample2] = leftChannel[_sample2] - offset;
      }

      // Cater for ampitide over and below -1 and 1 as a result of DC offset. Shrinks waveform.
      var highestSamp = 0;
      var lowestSamp = 0;
      for (var _sample3 = 0; _sample3 < bufferSize; _sample3++) {
        var samp = leftChannel[_sample3];
        if (samp < lowestSamp) {
          lowestSamp = samp;
        }
        if (samp > highestSamp) {
          highestSamp = samp;
        }
      }
      lowestSamp = Math.abs(lowestSamp);
      var largest = 0;
      if (lowestSamp >= highestSamp) {
        largest = lowestSamp;
      } else {
        largest = highestSamp;
      }

      var perc = void 0;

      if (largest == 0) {
        perc = 1;
      } else {
        perc = 1 / largest;
      }

      if (numChannels == 1) {
        for (var _sample4 = 0; _sample4 < bufferSize; _sample4++) {
          var newSamp = leftChannel[_sample4] * perc;
          leftChannel[_sample4] = newSamp;
        }
        if (addFades) {
          // Clean up ends of auido.
          createFades(leftChannel, 1000);
        }
      } else if (numChannels == 2) {
        for (var _sample5 = 0; _sample5 < bufferSize; _sample5++) {
          var _newSamp = leftChannel[_sample5] * perc;
          leftChannel[_sample5] = _newSamp;
          rightChannel[_sample5] = _newSamp;
        }
        if (addFades) {
          // Clean up ends of auido.
          createFades(leftChannel, 1000);
          createFades(rightChannel, 1000);
        }
      }
    }
  }, {
    key: 'renderIteration',
    value: function renderIteration(ctrnn, inputs) {
      // Feed input into network.
      ctrnn.feedInputs(inputs);
      // Update network state.
      ctrnn.updateCTRNN();
      // Get network output.
      return ctrnn.getOutputs();
    }
  }, {
    key: 'createInputs',
    value: function createInputs(length, filler) {
      var input = new Array(length).fill(filler, 0);
      return [input, input, input, input];
    }
  }]);

  return CTRNNUtil;
}();
/*===========================================================================*\
 * Experimental implementation of MFCC.
 * (c) Vail Systems. Joshua Jung and Ben Bryan. 2015
 *
 * This code is not designed to be highly optimized but as an educational
 * tool to understand the Mel-scale and its related coefficients used in
 * human speech analysis.
\*===========================================================================*/

var MFCC = function () {
  function MFCC(fftSize, bankCount, lowFrequency, highFrequency, sampleRate) {
    _classCallCheck(this, MFCC);

    if (!fftSize) throw Error('Please provide an fftSize');
    if (!bankCount) throw Error('Please provide a bankCount');
    if (!lowFrequency) throw Error('Please provide a low frequency cutoff.');
    if (!highFrequency) throw Error('Please provide a high frequency cutoff.');
    if (!sampleRate) throw Error('Please provide a valid sampleRate.');

    this.fftSize = fftSize;
    this.bankCount = bankCount;
    this.lowFrequency = lowFrequency;
    this.highFrequency = highFrequency;
    this.sampleRate = sampleRate;
    this.filterBank = this.constructMelFilterBank();
  }
  /**
   * Perform a full MFCC on a FFT spectrum.
   *
   * FFT Array passed in should contain frequency amplitudes only.
   *
   */


  _createClass(MFCC, [{
    key: 'process',
    value: function process(fft) {
      var dct = new DCT();
      if (fft.length != this.fftSize) {
        throw Error('Passed in FFT bins were incorrect size. Expected ' + this.fftSize + ' but was ' + fft.length);
      }
      var melSpec = this.filterBank.filter(fft),
          melSpecLog = melSpec.map(log),
          melCoef = dct.process(melSpecLog).slice(0, 13);
      return melCoef;
    }
  }, {
    key: 'constructMelFilterBank',
    value: function constructMelFilterBank() {
      var bins = [],
          fq = [],
          filters = [];

      var lowM = this.hzToMels(this.lowFrequency),
          highM = this.hzToMels(this.highFrequency),
          deltaM = (highM - lowM) / (this.bankCount + 1);
      // Construct equidistant Mel values between lowM and highM.
      for (var i = 0; i < this.bankCount; i++) {
        // Get the Mel value and convert back to frequency.
        // e.g. 200 hz <=> 401.25 Mel
        fq[i] = this.melsToHz(lowM + i * deltaM);

        // Round the frequency we derived from the Mel-scale to the nearest actual FFT bin that we have.
        // For example, in a 64 sample FFT for 8khz audio we have 32 bins from 0-8khz evenly spaced.
        bins[i] = Math.floor((this.fftSize + 1) * fq[i] / (this.sampleRate / 2));
      }
      // Construct one cone filter per bin.
      // Filters end up looking similar to [... 0, 0, 0.33, 0.66, 1.0, 0.66, 0.33, 0, 0...]
      for (var i = 0; i < bins.length; i++) {
        filters[i] = [];
        var filterRange = i != bins.length - 1 ? bins[i + 1] - bins[i] : bins[i] - bins[i - 1];
        filters[i].filterRange = filterRange;
        for (var f = 0; f < this.fftSize; f++) {
          // Right, outside of cone
          if (f > bins[i] + filterRange) filters[i][f] = 0.0;
          // Right edge of cone
          else if (f > bins[i]) filters[i][f] = 1.0 - (f - bins[i]) / filterRange;
            // Peak of cone
            else if (f == bins[i]) filters[i][f] = 1.0;
              // Left edge of cone
              else if (f >= bins[i] - filterRange) filters[i][f] = 1.0 - (bins[i] - f) / filterRange;
                // Left, outside of cone
                else filters[i][f] = 0.0;
        }
      }
      // Here we actually apply the filters one by one. Then we add up the results of each applied filter
      // to get the estimated power contained within that Mel-scale bin.
      //
      // First argument is expected to be the result of the frequencies passed to the powerSpectrum
      // method.
      return {
        filters: filters,
        lowMel: this.lowM,
        highMel: this.highM,
        deltaMel: this.deltaM,
        lowFreq: this.lowF,
        highFreq: this.highF,
        filter: function filter(freqPowers) {
          var ret = [];
          filters.forEach(function (filter, fIx) {
            var tot = 0;
            freqPowers.forEach(function (fp, pIx) {
              tot += fp * filter[pIx];
            });
            ret[fIx] = tot;
          });
          return ret;
        }
      };
    }
  }, {
    key: 'melsToHz',
    value: function melsToHz(mels) {
      return 700 * (Math.exp(mels / 1127) - 1);
    }
  }, {
    key: 'hzToMels',
    value: function hzToMels(hertz) {
      return 1127 * Math.log(1 + hertz / 700);
    }
    /**
    * Estimate the power spectrum density from FFT amplitudes.
    */

  }, {
    key: 'powerSpectrum',
    value: function powerSpectrum(amplitudes) {
      var N = amplitudes.length;

      return amplitudes.map(function (a) {
        return a * a / N;
      });
    }
  }]);

  return MFCC;
}();

/*===========================================================================*\
 * Discrete Cosine Transform
 *
 * (c) Vail Systems. Joshua Jung and Ben Bryan. 2015
 *
 * This code is not designed to be highly optimized but as an educational
 * tool to understand the Mel-scale and its related coefficients used in
 * human speech analysis.
\*===========================================================================*/

var DCT = function () {
  function DCT() {
    _classCallCheck(this, DCT);

    this.cosMap = {};
  }
  // Builds a cosine map for the given input size. This allows multiple input sizes to be memoized automagically
  // if you want to run the DCT over and over.


  _createClass(DCT, [{
    key: 'memoizeCosines',
    value: function memoizeCosines(N) {
      this.cosMap[N] = new Array(N * N);

      var PI_N = Math.PI / N;

      for (var k = 0; k < N; k++) {
        for (var n = 0; n < N; n++) {
          this.cosMap[N][n + k * N] = Math.cos(PI_N * (n + 0.5) * k);
        }
      }
    }
  }, {
    key: 'process',
    value: function process(signal, scale) {
      var _this5 = this;

      var L = signal.length;
      scale = scale || 2;

      if (!this.cosMap || !this.cosMap[L]) this.memoizeCosines(L);

      var coefficients = signal.map(function () {
        return 0;
      });

      return coefficients.map(function (__, ix) {
        return scale * signal.reduce(function (prev, cur, ix_, arr) {
          return prev + cur * _this5.cosMap[L][ix_ + ix * L];
        }, 0);
      });
    }
  }]);

  return DCT;
}();

var SampleBuffer = exports.SampleBuffer = function () {
  function SampleBuffer(length, sampleRate) {
    _classCallCheck(this, SampleBuffer);

    this.leftChannel = new Float32Array(length);
    this.rightChannel = new Float32Array(length);
    this.length = length;
    this.sampleRate = sampleRate;
  }

  _createClass(SampleBuffer, [{
    key: 'getChannelData',
    value: function getChannelData(channel) {
      if (channel == 0) {
        return this.leftChannel;
      }
      if (channel == 1) {
        return this.rightChannel;
      }
    }
  }, {
    key: 'resetSampleBuffer',
    value: function resetSampleBuffer(buffer) {
      var length = this.leftChannel.length;
      for (var sample = 0; sample < length; sample++) {
        if (buffer) {
          this.leftChannel[sample] = buffer[sample];
          this.rightChannel[sample] = buffer[sample];
        } else {
          this.leftChannel[sample] = 0.5;
          this.rightChannel[sample] = 0.5;
        }
      }
    }
  }]);

  return SampleBuffer;
}();