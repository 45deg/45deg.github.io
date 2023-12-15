function average(arr) {
    if (arr.length === 0) {
        return 0;
    }
    var sum = arr.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    return sum / arr.length;
}

var DemoBase = (function () {
    /*
     * Base Class of Demo
     */

    DB.rapheal = null;

    function DB(index, layerDefs, dataset) {
        this.timer = -1;
        this.layerDefs = layerDefs;
        this.visualizer = null;
        this.dataset = this.convertDataset(dataset);

        this.speed = $('input[name=speed]:checked').val() | 0;
        this.init(index);
        this.reset();
    }

    DB.prototype.convertDataset = function (rawDataset) {
        var dim = rawDataset[0][0].length;
        var dataset = [];
        for (var i = 0; i < rawDataset.length; ++i) {
            var vol = new convnetjs.Vol(1, 1, dim);
            for (var j = 0; j < dim; ++j) {
                vol.w[j] = rawDataset[i][0][j];
            }
            dataset[i] = [vol, rawDataset[i][1]];
        }
        return dataset;
    }

    DB.prototype.init = function (index) {
        $('.demofield').hide();
        $('#demo' + index).show();
        LayerEditor.setData(this.layerDefs);
        DB.rapheal = DB.rapheal || Raphael('network');

        this.visualizer = new NetworkVisualizer(DB.rapheal, this.layerDefs);
        this.visualizer.createNodes();
        this.visualizer.connectAll();
    };

    DB.prototype.reset = function () {
        this.state = DB.State.BEFORE_TRAIN;
        clearInterval(this.timer);
        $('#train').val('train');
        $('#step-output').html('0');
        $('#error-output').html('0');

        this.network = new convnetjs.Net();
        this.network.makeLayers(this.layerDefs);
        this.trainer = new convnetjs.Trainer(this.network, TrainerManager.getCurrentTrainer());
        this.controller = new VisualizerController(this.network, this.visualizer);
    };

    DB.prototype.startTraining = function () {
        this.beforeTraining();
        this.state = DB.State.TRAINING;
        if ($('input[name=endcond]:checked').val() === 'steps') {
            this.ecStep = parseInt($('#step').val());  // end condition: step
            this.ecError = -1;  // end condition: error
        } else {
            this.ecStep = Number.MAX_VALUE;  // end condition: step
            this.ecError = parseFloat($('#error').val());  // end condition: error
        }
        this.step = 0;
        this.counter = 0;
        this.error = [];
        this.epoch = 0;
        this.index = 0;
        this.timer = setInterval(this.tick.bind(this), 15);
    };

    DB.prototype.finishTraining = function () {
        clearInterval(this.timer);
        this.state = DB.State.TRAINED;
        $('#train').val('retry');
        this.afterTraining();
    };

    DB.prototype.tick = function () {
        var i;
        var pattern = this.dataset;
        if (this.speed <= 1) {
            if (this.speed === 0 && this.counter++ % 50 !== 0) return;
            i = this.step % pattern.length;
            if (i === 0) {
                if (this.step > 0) {
                    this.onEpoch();
                }
                this.resultData = new Array(pattern.length);
            }
            var result = this.trainer.train(pattern[i][0], pattern[i][1]);
            this.error[i] = result.loss;
            this.resultData[i] = [pattern[i][0], pattern[i][1], this.network.getPrediction()];
            this.controller.applyNetwork();
            this.step++;
            if (this.ecStep <= this.step ||
                (this.ecError >= 0 && i === pattern.length - 1 &&
                    this.ecError > average(this.error))) {
                this.finishTraining();
            }
        } else {
            var epoch = Math.pow(2, this.speed - 1);
            OUTER: for (var n = 0; n < epoch; ++n) {
                this.resultData = new Array(pattern.length);
                for (i = 0; i < pattern.length; ++i) {
                    var result = this.trainer.train(pattern[i][0], pattern[i][1]);
                    this.error[i] = result.loss;
                    this.resultData[i] = [pattern[i][0], pattern[i][1], this.network.getPrediction()];
                    this.step++;
                    if (this.ecStep <= this.step ||
                        (this.ecError >= 0 && i === pattern.length - 1 &&
                            this.ecError > average(this.error))) {
                        this.finishTraining();
                        break OUTER;
                    }
                }
            }
            this.onEpoch();
            var stubpat = pattern[this.counter++ % pattern.length];
            this.trainer.net.forward(stubpat[0]);
            this.controller.applyNetwork();
        }

        this.onTick();
        $('#step-output').html(this.step);
        $('#error-output').html(average(this.error));
    };

    DB.prototype.pauseTraining = function () {
        this.state = DB.State.PAUSE;
        clearInterval(this.timer);
    };

    DB.prototype.resumeTraining = function () {
        this.state = DB.State.TRAINING;
        this.timer = setInterval(this.tick.bind(this), 15);
    };

    DB.State = {
        BEFORE_TRAIN: 0,
        TRAINING: 1,
        PAUSE: 2,
        TRAINED: 3
    };

    DB.prototype.state = DB.State.BEFORE_TRAIN;
    DB.prototype.beforeTraining = function () { };
    DB.prototype.afterTraining = function () { };
    DB.prototype.onTick = function () { };
    DB.prototype.onEpoch = function () { };

    DB.prototype.disableParams = function () {
        $('.param input:not([name=speed])').attr('disabled', 'disabled');
    };

    DB.prototype.enableParams = function () {
        $('.param input').removeAttr('disabled');
    };

    DB.prototype.deinit = function () {
        clearInterval(this.timer);
        this.visualizer.clearAll();
        this.visualizer = this.network = this.controller = null;
    };

    return DB;
})();

var Demos = [];

Demos[0] = null; // missing number


Demos[1] = (function () {
    /*
     * Demo 1: XOR
     */

    function XOR(hlayer) {
        var defaultLayer = [
            { type: 'input', out_sx: 1, out_sy: 1, out_depth: 3 },
            { type: 'fc', num_neurons: 5, activation: 'tanh' },
            { type: 'softmax', num_classes: 2 }
        ];
        hlayer = hlayer || defaultLayer;

        DemoBase.call(this, '1', hlayer, [
            [[0, 0, 0], 0],
            [[0, 0, 1], 1],
            [[0, 1, 0], 1],
            [[0, 1, 1], 0],
            [[1, 0, 0], 1],
            [[1, 0, 1], 0],
            [[1, 1, 0], 0],
            [[1, 1, 1], 1]
        ]);
        if (!XOR.prepared) XOR.prepare();
    }
    XOR.prepared = false;

    XOR.prepare = function () {
        $('.test-xor').click(function () {
            var num = $(this).data('input');
            var input = new convnetjs.Vol(1, 1, 3);
            input.w[0] = (num >> 2) & 1;
            input.w[1] = (num >> 1) & 1;
            input.w[2] = num & 1;
            demo.trainer.net.forward(input);
            demo.controller.applyNetwork(demo.trainer.net);
        });
        XOR.prepared = true;
    };

    XOR.prototype = Object.create(DemoBase.prototype);
    XOR.prototype.constructor = DemoBase;

    XOR.prototype.beforeTraining = function () {
        Plotly.purge('plotly-chart');
        const traceAccuracy = {
            x: [],
            y: [],
            mode: 'lines',
            type: 'scatter',
            showlegend: false
        };
        const traceLoss = {
            x: [],
            y: [],
            xaxis: 'x2',
            yaxis: 'y2',
            mode: 'lines',
            showlegend: false,
            type: 'scatter'
        };
        const layout = {
            title: 'Train accuracy and loss',
            xaxis: { title: 'Epochs' },
            yaxis: { title: 'Accuracy', range: [0, 1] },
            xaxis2: { title: 'Epochs', anchor: 'y2' },
            yaxis2: { title: 'Loss', anchor: 'x2', range: [0, 1] },
            grid: { rows: 2, columns: 1, pattern: 'independent' },
            plot_bgcolor: '#f0f8ff',
            margin: {
                r: 0, b: 50, t: 50
            },
        };
        Plotly.newPlot('plotly-chart', [traceAccuracy, traceLoss], layout);
    }

    XOR.prototype.onEpoch = function () {
        var accuracy = 0;
        this.resultData.forEach(function (r) {
            if (r[1] === r[2]) accuracy++;
        });
        accuracy /= this.dataset.length;
        Plotly.extendTraces('plotly-chart', {
            x: [[this.step], [this.step]],
            y: [[accuracy], [average(this.error)]]
        }, [0, 1]);
    };

    return XOR;
})();


Demos[2] = (function () {
    /*
     * Demo 2: Functional Approximation
     */

    function Approx(hlayer) {
        this.plot = Raphael('plot', 400, 300);
        this.width = 400;
        this.height = 300;

        var dataset = this.makeDataset(0, 20);
        var defaultLayer = [
            { type: 'input', out_sx: 1, out_sy: 1, out_depth: 1 },
            { type: 'fc', num_neurons: 4, activation: 'tanh' },
            { type: 'fc', num_neurons: 4, activation: 'tanh' },
            { type: 'fc', num_neurons: 4, activation: 'tanh' },
            { type: 'regression', num_neurons: 1 }
        ];
        hlayer = hlayer || defaultLayer;
        DemoBase.call(this, '2', hlayer, dataset);

        if (!Approx.prepared) Approx.prepare();

        this.resetField(dataset);
    }

    Approx.prepared = false;
    Approx.prototype = Object.create(DemoBase.prototype);
    Approx.prototype.constructor = DemoBase;

    Approx.prepare = function () {
        $('#functype').change(function (e) {
            var index = $('#functype option:selected').val() | 0;
            var k = 20;
            if (index === 3) { // random 
                k = 6;
                $('#regen-random').show();
            } else {
                $('#regen-random').hide();
            }
            var dataset = demo.makeDataset(index, k);
            demo.reset();
            demo.resetField(dataset);
        });
        $('#regen-random').hide();
        $('#regen-random').click(function () {
            var index = $('#functype option:selected').val() | 0;
            if (index === 3) {
                var dataset = demo.makeDataset(index, 6);
                demo.resetField(dataset);
            }
        });
    };

    Approx.Form = [
        function (x) { return (Math.sin(2 * Math.PI * x) + 1) / 2; }, // Sine Function
        function (x) { return Math.abs(x - 1 / 2) * 2; }, // Valley
        function (x) {
            if (Math.abs(x - 0.5) < 0.01) return 1 / 2;
            if (x < 0.5) return 0;
            if (x > 0.5) return 1;
        },// Step Function
        function (x) {
            return Math.random();
        } // Random Function
    ];

    Approx.prototype.transform = function (point) {
        return [point[0] * this.width, (1 - point[1]) * (this.height - 50) + 25];
    };

    Approx.prototype.makeDataset = function (index, k) {
        var f = Approx.Form[index];
        var data = [];
        for (var i = 0; i <= k; ++i) {
            data[i] = [[i / k], [f(i / k)]];
        }
        return data;
    };

    Approx.prototype.plotPoints = function (points) {
        for (var i = 0; i < points.length; ++i) {
            var p = this.transform(points[i]);
            this.plot.circle(p[0], p[1], 3).attr({
                'fill': 'blue',
                'stroke-width': 0
            });
        }
    };

    Approx.prototype.plotFunction = function (f, lb, ub, step) {
        var transform = this.transform.bind(this);
        function getPath(x1, x2) {
            var y1 = f(x1), y2 = f(x2);
            var x0 = (x1 + x2) / 2;
            var y0 = 2 * f(x0) - (y1 + y2) / 2;
            return 'M' + transform([x1, y1]).join(',') +
                'Q' +
                transform([x0, y0]).join(',') + ' ' +
                transform([x2, y2]).join(',');
        }
        var str = '';
        var dx = (ub - lb) / step;
        for (var n = 0; n < step; ++n) {
            str += getPath(n * dx + lb, (n + 1) * dx + lb);
        }
        return this.plot.path(str).attr('stroke', 'red');
    };

    Approx.prototype.onTick = function () {
        var self = this;
        this.curve.remove();
        this.curve = this.plotFunction(function (x) {
            var v = new convnetjs.Vol(1, 1, 1);
            v.w[0] = x;
            var retval = demo.trainer.net.forward(v);
            return retval.w[0];
        }, 0, 1, 20);
    };

    Approx.prototype.reset = function () {
        if (this.curve) this.curve.remove();
        DemoBase.prototype.reset.call(this);
    };

    Approx.prototype.resetField = function (dataset) {
        this.plot.clear();
        this.plotPoints(dataset.map(function (a) { return [a[0][0], a[1][0]]; }))
        this.dataset = this.convertDataset(dataset);
    };

    Approx.prototype.beforeTraining = function () {
        var self = this;
        if (!!this.curve) this.curve.remove();
        this.curve = this.plotFunction(function (x) {
            return 1;
        }, 0, 1, 20);

        Plotly.purge('plotly-chart');
        const traceAccuracy = {
            x: [],
            y: [],
            mode: 'lines',
            type: 'scatter',
            showlegend: false
        };
        const traceLoss = {
            x: [],
            y: [],
            xaxis: 'x2',
            yaxis: 'y2',
            mode: 'lines',
            showlegend: false,
            type: 'scatter'
        };
        const layout = {
            title: 'MSE and loss',
            xaxis: { title: 'Epochs' },
            yaxis: { title: 'MSE' },
            xaxis2: { title: 'Epochs', anchor: 'y2' },
            yaxis2: { title: 'Loss', anchor: 'x2', range: [0, 1] },
            grid: { rows: 2, columns: 1, pattern: 'independent' },
            plot_bgcolor: '#f0f8ff',
            margin: {
                r: 0, b: 50, t: 50
            },
        };
        Plotly.newPlot('plotly-chart', [traceAccuracy, traceLoss], layout, { responsive: true });
    };

    Approx.prototype.deinit = function () {
        this.plot.remove();
        DemoBase.prototype.deinit.call(this);
    };

    Approx.prototype.onEpoch = function () {
        var mse = 0;
        this.resultData.forEach(function (r) {
            var actual = demo.trainer.net.forward(r[0]).w[0];
            mse += Math.pow(r[1][0] - actual, 2);
        });
        mse /= this.dataset.length;
        Plotly.extendTraces('plotly-chart', {
            x: [[this.step], [this.step]],
            y: [[mse], [average(this.error)]]
        }, [0, 1]);
    };

    return Approx;
})();


Demos[3] = (function () {
    /*
     * Demo 3: Pattern Recognition
     */

    function Recognition(hlayer) {

        // make datasets
        var dataset = Recognition.Digits.map(function (e, i) {
            return [e, i];
        });

        // Add extra data
        dataset = dataset.concat(Recognition.extraDataset.map(function (e) {
            return [e, 1];
        }));

        if (!Recognition.prepared) Recognition.prepare();

        var defaultLayer = [
            { type: 'input', out_sx: 1, out_sy: 1, out_depth: 15 },
            { type: 'fc', num_neurons: 10, activation: 'relu' },
            { type: 'softmax', num_classes: 10 }
        ];
        hlayer = hlayer || defaultLayer;
        DemoBase.call(this, '3', hlayer, dataset);
    }

    Recognition.prepared = false;
    Recognition.prototype = Object.create(DemoBase.prototype);
    Recognition.prototype.constructor = DemoBase;

    Recognition.prepare = function () {

        $('#panel td').click(function () {
            $(this).toggleClass('on');
            recognize();
        });
        $('.pat-num').click(function () {
            demo.setPattern(Recognition.Digits[this.value | 0]);
            recognize();
        });
        $('#clear').click(function () {
            demo.setPattern([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        });

        function recognize() {
            var input = demo.getPatternAsVol();
            var result = demo.trainer.net.forward(input).w;
            demo.controller.applyNetwork();

            var max_i = 0, max = -1;
            for (var i = 0; i < result.length; ++i) {
                if (max <= result[i]) {
                    max_i = i;
                    max = result[i];
                }
            }
            $('#pat-output').html(max_i);
        }

        Recognition.prepared = true;
    };

    Recognition.prototype.setPattern = function (pattern) {
        $('#panel td').each(function (index) {
            if (pattern[index])
                $(this).addClass('on');
            else
                $(this).removeClass('on');
        });
    };

    Recognition.prototype.getPatternAsVol = function (pattern) {
        var vol = new convnetjs.Vol(1, 1, 15);
        $('#panel td').each(function (index) {
            vol.w[index] = $(this).hasClass('on') * 1;
        });
        return vol;
    };

    Recognition.Digits = [
        [1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1],
        [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
        [1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1],
        [1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1],
        [1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1],
        [1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1],
        [1, 1, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
        [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1],
        [1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1]
    ];

    Recognition.extraDataset = [
        [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]
    ];

    Recognition.prototype.beforeTraining = function () {
        Plotly.purge('plotly-chart');
        const traceAccuracy = {
            x: [],
            y: [],
            mode: 'lines',
            type: 'scatter',
            showlegend: false
        };
        const traceLoss = {
            x: [],
            y: [],
            xaxis: 'x2',
            yaxis: 'y2',
            mode: 'lines',
            showlegend: false,
            type: 'scatter'
        };
        const layout = {
            title: 'Train accuracy and loss',
            xaxis: { title: 'Epochs' },
            yaxis: { title: 'Accuracy', range: [0, 1] },
            xaxis2: { title: 'Epochs', anchor: 'y2' },
            yaxis2: { title: 'Loss', anchor: 'x2' },
            grid: { rows: 2, columns: 1, pattern: 'independent' },
            plot_bgcolor: '#f0f8ff',
            margin: {
                r: 0, b: 50, t: 50
            },
        };
        Plotly.newPlot('plotly-chart', [traceAccuracy, traceLoss], layout);
    }

    Recognition.prototype.onEpoch = function () {
        var accuracy = 0;
        this.resultData.forEach(function (r) {
            if (r[1] === r[2]) accuracy++;
        });
        accuracy /= this.dataset.length;
        Plotly.extendTraces('plotly-chart', {
            x: [[this.step], [this.step]],
            y: [[accuracy], [average(this.error)]]
        }, [0, 1]);
    };

    return Recognition;
})();
