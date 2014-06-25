var NeuralNetwork = (function() {

    function NN(elements) {
        this.step = 0;
        this.elements = elements;
        this.error = 0;
        this.initState();
    }

    NN.prototype.initState = function() {
        var elements = this.elements;
        var activations = this.activations = [];
        this.elements.forEach(function(num) {
            activations.push(repl(0, num));
        });

        this.weights = [];
        // this.changes = [];
        for (var l = 0; l < elements.length - 1; ++l) {
            this.weights[l] = []; // this.changes[l] = [];
            for (var i = 0; i < elements[l]; ++i) {
                this.weights[l][i] = []; // this.changes[l][i] = [];
                for (var j = 0; j < elements[l + 1]; ++j) {
                    this.weights[l][i][j] = rand(-1, 1);
                    // this.changes[l][i][j] = 0;
                }
            }
        }
    };

    NN.prototype.update = function(inputs) {
        if (inputs.length !== this.elements[0])
            throw 'Input size is wrong.';
        var l, i, j;

        for (i = 0; i < inputs.length; ++i)
            this.activations[0][i] = inputs[i];
        for (l = 0; l < this.elements.length - 1; ++l) {
            for (j = 0; j < this.elements[l + 1]; ++j) {
                var sum = 0;
                for (i = 0; i < this.elements[l]; ++i) {
                    sum += this.activations[l][i] * this.weights[l][i][j];
                }
                this.activations[l + 1][j] = sigmoid(sum);
            }
        }

        return this.activations[this.activations.length - 1];
    };

    NN.prototype.backPropagate = function(target, p) {
        if (target.length !== this.elements[this.elements.length - 1])
            throw 'Target size is wrong.';

        var act = this.activations;
        var w = this.weights;
        var l, i, j;
        var delta = [];
        for (l = 0; l < this.elements.length; ++l) {
            delta[l] = [];
            for (i = 0; i < this.elements[l]; ++i)
                delta[l][i] = 0;
        }

        // hidden -> output
        var o = this.elements.length - 1;
        for (i = 0; i < this.elements[o]; ++i) {
            delta[o][i] = (target[i] - act[o][i]) * dsigm(act[o][i]);
        }

        // hidden or input -> hidden
        for (l = this.elements.length - 2; l > 0; --l) {
            for (i = 0; i < this.elements[l]; ++i) {
                for (j = 0; j < this.elements[l + 1]; ++j) {
                    delta[l][i] += delta[l + 1][j] * w[l][i][j];
                }
                delta[l][i] *= dsigm(act[l][i]);
            }
        }

        // update weights
        for (l = 0; l < this.elements.length - 1; ++l) {
            for (i = 0; i < this.elements[l]; ++i) {
                for (j = 0; j < this.elements[l + 1]; ++j) {
                    w[l][i][j] = w[l][i][j] + p * delta[l + 1][j] * act[l][i];
                }
            }
        }

        var error = 0;
        for (i = 0; i < target.length; ++i)
            error = Math.max(Math.abs(target[i] - act[o][i]), error);
        return error;
    };

    /*
    NN.prototype.train = function(pattern, p){
        if(!this.step) this.step = 0;
        var self = this;
        return function(i){
            self.update(pattern[i][0]);
            self.backPropagate(pattern[i][1], p);
            self.step++;
        };
    };
    */

    var rand = function(a, b) { return (b - a) * Math.random() + a; };
    var repl = function(elem, times) {
        return Array.apply(null, Array(times)).map(function() { return elem; });
    };

    var sigmoid = function(x) { return 1 / (1 + Math.exp(-x)); };
    var dsigm = function(y) { return y * (1 - y); };

    return NN;
})();
