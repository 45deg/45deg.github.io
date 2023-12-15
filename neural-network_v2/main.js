var demo = null;
var TrainerManager = {
  trainerParameter: { method: 'adadelta', l2_decay: 0.001, batch_size: 10 },
  getCurrentTrainer: function () {
    return TrainerManager.trainerParameter;
  },
  setTrainer: function (trainer) {
    TrainerManager.trainerParameter = trainer;
    var json = JSON.stringify(trainer);
    //format
    json = json.replace(/({|,)/g, '$1\n  ');
    json = json.replace(/}/g, '\n}');
    json = json.replace(/:/g, ': ');
    $('#trainerparam').val(json);
  }
};

$(document).ready(function () {

  $('#demos').change(function () {
    var num = $('#demos option:selected').val() | 0;
    demo.deinit();
    demo = new Demos[num]();
    location.hash = num;
    console.log(demo);
  });

  //$('#plotly-chart').hide();
  $('#showmeasure').click(function () {
    $('#plotly-chart').toggle();
  });

  $('#init').click(function () {
    LayerEditor.applyToNetwork();
  });

  $('input[type=range]').mousemove(function () {
    $('#' + this.id + 'view').html(this.value);
  });

  $('#train').click(function () {
    var button = $(this);
    switch (demo.state) {
      case DemoBase.State.TRAINED:
        demo.reset();
      case DemoBase.State.BEFORE_TRAIN:
        demo.startTraining();
        button.val('pause');
        break;
      case DemoBase.State.TRAINING:
        demo.pauseTraining();
        button.val('resume');
        break;
      case DemoBase.State.PAUSE:
        demo.resumeTraining();
        button.val('pause');
        break;
    }
  });

  $('input[name=speed]').change(function () {
    demo.speed = this.value | 0;
  });

  var demosNum = location.hash.slice(1) | 0;
  if (demosNum < 1 || demosNum > 3) demosNum = 1;
  demo = new Demos[demosNum]();
  $('#demos').val(demosNum);

  // trainer
  var trainerDefaultParams = {
    'sgd': { learning_rate: 0.01, l2_decay: 0.001, momentum: 0.9, batch_size: 10, l1_decay: 0.001 },
    'adadelta': { l2_decay: 0.001, batch_size: 10 },
    'adagrad': { learning_rate: 0.01, l2_decay: 0.001, momentum: 0.9, batch_size: 10, l1_decay: 0.001 }
  };

  function fillInParameterForm() {
    var method = $('#trainer option:selected').val();
    var json = JSON.stringify(trainerDefaultParams[method]);
    //format
    json = json.replace(/({|,)/g, '$1\n  ');
    json = json.replace(/}/g, '\n}');
    json = json.replace(/:/g, ': ');
    $('#trainerparam').val(json);
  }

  $('#trainerapply').click(function () {
    var trainer;
    try {
      trainer = JSON.parse($('#trainerparam').val());
      trainer.method = $('#trainer option:selected').val();
    } catch (e) {
      alert('Invalid trainer parameter!');
    }
    TrainerManager.setTrainer(trainer)
    $(this).hide();
  });

  // set default parameter
  $('#trainer').change(function () {
    fillInParameterForm();
    $('#trainerapply').show();
  });

  $('#trainerparam').change(function () {
    $('#trainerapply').show();
  });

  // set default parameter at first
  fillInParameterForm();
  // hide apply button
  $('#trainerapply').hide();
});