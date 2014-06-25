var DemoBase = (function() {
    /*
     * Base Class of Demo
     */

    function DB(index, layer, dataset) {
        this.timer = -1;
        this.layer = layer;
        this.visualizer = null;
        this.dataset = dataset;
        this.speed = $('input[name=speed]:checked').val() | 0;
        this.init(index);
        this.reset();
    }

    DB.prototype.init = function(index) {
        $('.demofield').hide();
        $('#demo' + index).show();
        $('#hlayers').val(this.layer.slice(1, this.layer.length - 1));

        this.visualizer = new NetworkVisualizer(Raphael('network'), this.layer);
        this.network = new NeuralNetwork(this.layer);
        this.controller = new VisualizerController(this.network, this.visualizer);

        this.visualizer.createNodes();
        this.visualizer.connectAll();
    };

    DB.prototype.reset = function() {
        this.state = DB.State.BEFORE_TRAIN;
        clearInterval(this.timer);
        $('#train').val('train');
        $('#step-output').html('0');
        $('#error-output').html('0');
        this.network.initState();
        this.controller.applyActivation();
        this.controller.applyWeight();
    };

    DB.prototype.startTraining = function() {
        this.beforeTraining();
        this.state = DB.State.TRAINING;
        this.lr = parseFloat($('#rl').val());
        if ($('input[name=endcond]:checked').val() === 'steps') {
            this.ecStep = parseInt($('#step').val());  // end condition: step
            this.ecError = -1;  // end condition: error
        }else {
            this.ecStep = Number.MAX_VALUE;  // end condition: step
            this.ecError = parseFloat($('#error').val());  // end condition: error
        }
        this.step = 0;
        this.counter = 0;
        this.error = [];
        this.timer = setInterval(this.tick.bind(this), 15);
    };

    DB.prototype.finishTraining = function() {
        clearInterval(this.timer);
        this.state = DB.State.TRAINED;
        $('#train').val('retrain');
        this.afterTraining();
    };

    DB.prototype.tick = function() {
        var i;
        var pattern = this.dataset;
        if (this.speed <= 1) {
            if (this.speed === 0 && this.counter++ % 50 !== 0) return;
            i = this.step % pattern.length;
            this.network.update(pattern[i][0]);
            this.error[i] = this.network.backPropagate(pattern[i][1], this.lr);
            this.controller.applyActivation();
            this.controller.applyWeight();
            this.step++;
            if (this.ecStep <= this.step || (this.ecError >= 0 && i === pattern.length - 1 && this.ecError > Math.max.apply(null, this.error))) {
                this.finishTraining();
            }
        } else {
            var epoch = Math.pow(10, this.speed - 1);
            OUTER: for (var n = 0; n < epoch; ++n) {
                for (i = 0; i < pattern.length; ++i) {
                    this.network.update(pattern[i][0]);
                    this.error[i] = this.network.backPropagate(pattern[i][1], this.lr);
                    this.step++;
                    if (this.ecStep <= this.step || (this.ecError >= 0 && i === pattern.length - 1 && this.ecError > Math.max.apply(null, this.error))) {
                        this.finishTraining();
                        break OUTER;
                    }
                }
            }
            this.controller.applyWeight();
            this.network.update(pattern[this.counter++ % pattern.length][0]);
            this.controller.applyActivation();
        }

        this.onTick();
        $('#step-output').html(this.step);
        $('#error-output').html(Math.max.apply(null, this.error));
    };

    DB.prototype.pauseTraining = function() {
        this.state = DB.State.PAUSE;
        clearInterval(this.timer);
    };

    DB.prototype.resumeTraining = function() {
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
    DB.prototype.beforeTraining = function() {};
    DB.prototype.afterTraining = function() {};
    DB.prototype.onTick = function() {};

    DB.prototype.disableParams = function() {
        $('.param input:not([name=speed])').attr('disabled', 'disabled');
    };

    DB.prototype.enableParams = function() {
        $('.param input').removeAttr('disabled');
    };

    DB.prototype.deinit = function() {
        clearInterval(this.timer);
        this.visualizer.clearAll();
        this.visualizer = this.network = this.controller = null;
    };

    DB.prototype.makeLayers = function(hlayer, input, output, defaultLayer) {
        if (!hlayer || !hlayer.length) hlayer = defaultLayer;
        hlayer.unshift(input);
        hlayer.push(output);
        return hlayer;
    };

    return DB;
})();

var Demos = [];

Demos[0] = null; // missing number


Demos[1] = (function() {
    /*
     * Demo 1: XOR
     */

    function XOR(hlayer) {
        DemoBase.call(this, '1', this.makeLayers(hlayer, 3, 1, [4, 4]), [
            [[0, 0, 0], [0]],
            [[0, 0, 1], [1]],
            [[0, 1, 0], [1]],
            [[0, 1, 1], [0]],
            [[1, 0, 0], [1]],
            [[1, 0, 1], [0]],
            [[1, 1, 0], [0]],
            [[1, 1, 1], [1]]
        ]);
        if (!XOR.prepared) XOR.prepare();
    }
    XOR.prepared = false;

    XOR.prepare = function(){
        $('.test-xor').click(function() {
            if (this.state !== DemoBase.State.TRAINING) {
                var num = $(this).data('input');
                var input = [(num >> 2) & 1, (num >> 1) & 1, num & 1];
                demo.network.update(input);
                demo.controller.applyActivation();
            }
        });
        XOR.prepared = true;
    };

    XOR.prototype = Object.create(DemoBase.prototype);
    XOR.prototype.constructor = DemoBase;

    return XOR;
})();


Demos[2] = (function() {
    /*
     * Demo 2: Functional Approximation
     */

    function Approx(hlayer) {
        this.plot = Raphael('plot', 400, 300);
        this.width = 400;
        this.height = 300;

        var dataset = this.makeDataset(0, 20);
        DemoBase.call(this, '2', this.makeLayers(hlayer, 2, 1, [6, 6, 6]), dataset);

        if(!Approx.prepared) Approx.prepare();

        this.resetField(this.dataset);
    }

    Approx.prepared = false;
    Approx.prototype = Object.create(DemoBase.prototype);
    Approx.prototype.constructor = DemoBase;

    Approx.prepare = function(){
        $('#functype').change(function(e) {
            var index = $('#functype option:selected').val() | 0;
            var k = 20;
            if(index === 3) { // random 
                k = 6;
                $('#regen-random').show();
            } else {
                $('#regen-random').hide();
            }
            demo.dataset = demo.makeDataset(index, k);
            demo.reset();
            demo.resetField(demo.dataset);
        });
        $('#regen-random').hide();
        $('#regen-random').click(function(){
            var index = $('#functype option:selected').val() | 0;
            if(index === 3) {
                demo.dataset = demo.makeDataset(index, 6);
                demo.resetField(demo.dataset);
            }
        });
    };

    Approx.Form = [
        function(x) { return (Math.sin(2 * Math.PI * x) + 1) / 2; }, // Sine Function
        function(x) { return Math.abs(x - 1 / 2) * 2; }, // Valley
        function(x) {
            if (Math.abs(x - 0.5) < 0.01) return 1 / 2;
            if (x < 0.5) return 0;
            if (x > 0.5) return 1;
        },// Step Function
        function(x) {
            return Math.random();
        } // Random Function
    ];

    Approx.prototype.transform = function(point) {
        return [point[0] * this.width, (1 - point[1]) * (this.height - 50) + 25];
    };

    Approx.prototype.makeDataset = function(index, k) {
        var f = Approx.Form[index];
        var data = [];
        for (var i = 0; i <= k; ++i) {
            data[i] = [[i / k, 1], [f(i / k)]];
        }
        return data;
    };

    Approx.prototype.plotPoints = function(points) {
        for (var i = 0; i < points.length; ++i) {
            var p = this.transform(points[i]);
            this.plot.circle(p[0], p[1], 3).attr({
                'fill': 'blue',
                'stroke-width' : 0
            });
        }
    };

    Approx.prototype.plotFunction = function(f, lb, ub, step) {
        var transform = this.transform.bind(this);
        function getPath(x1, x2) {
            var y1 = f(x1), y2 = f(x2);
            var x0 = (x1 + x2) / 2;
            var y0 = 2 * f(x0) - (y1 + y2) / 2;
            return 'M'+ transform([x1, y1]).join(',') +
                   'Q'+
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

    Approx.prototype.onTick = function() {
        var self = this;
        this.curve.remove();
        this.curve = this.plotFunction(function(x) {
            return self.network.update([x, 1])[0];
        },0, 1, 20);
    };

    Approx.prototype.reset = function() {
        if (this.curve) this.curve.remove();
        DemoBase.prototype.reset.call(this);
    };

    Approx.prototype.resetField = function(dataset) {
        this.plot.clear();
        this.plotPoints(dataset.map(function(a) { return [a[0][0], a[1][0]]; }));
    };

    Approx.prototype.beforeTraining = function() {
        var self = this;
        if (!!this.curve) this.curve.remove();
        this.curve = this.plotFunction(function(x) {
            return self.network.update([x, 1])[0];
        },0, 1, 20);
    };

    Approx.prototype.deinit = function() {
        this.plot.remove();
        DemoBase.prototype.deinit.call(this);
    };

    return Approx;
})();


Demos[3] = (function() {
    /*
     * Demo 3: Pattern Recognition
     */

    function Recognition(hlayer) {

        // make datasets
        var dataset = Recognition.Digits.map(function(e, i) {
            var output = repl(0, 10);
            output[i] = 1;
            return [e, output];
        });

        // Add extra data
        dataset = dataset.concat(Recognition.extraDataset.map(function(e) {
            var output = repl(0, 10);
            output[1] = 1;
            return [e, output];
        }));

        if(!Recognition.prepared) Recognition.prepare();

        DemoBase.call(this, '3', this.makeLayers(hlayer, 15, 10, [30]), dataset);
    }

    Recognition.prepared = false;
    Recognition.prototype = Object.create(DemoBase.prototype);
    Recognition.prototype.constructor = DemoBase;

    Recognition.prepare = function(){

        $('#panel td').click(function() {
            $(this).toggleClass('on');
        });
        $('.pat-num').click(function() {
            demo.setPattern(Recognition.Digits[this.value | 0]);
        });
        $('#clear').click(function() {
            demo.setPattern([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        });

        $('#recog').click(function() {
            var input = demo.getPattern();
            var result = demo.network.update(input);
            demo.controller.applyActivation();

            var max_i = 0, max = -1;
            for (var i = 0; i < result.length; ++i) {
                if (max <= result[i]) {
                    max_i = i;
                    max = result[i];
                }
            }
            $('#pat-output').html(max_i);
        });

        Recognition.prepared = true;
    };

    Recognition.prototype.setPattern = function(pattern) {
        $('#panel td').each(function(index) {
            if (pattern[index])
                $(this).addClass('on');
            else
                $(this).removeClass('on');
        });
    };

    Recognition.prototype.getPattern = function(pattern) {
        var arr = [];
        $('#panel td').each(function(index) {
            arr[index] = $(this).hasClass('on') * 1;
        });
        return arr;
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

    var repl = function(elem, times) {
        return Array.apply(null, Array(times)).map(function() { return elem; });
    };

    return Recognition;
})();
