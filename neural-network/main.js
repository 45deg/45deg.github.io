var demo = null;

$(document).ready(function() {

    $('#demos').change(function() {
        var num = $('#demos option:selected').val() | 0;
        demo.deinit();
        demo = new Demos[num]();
        location.hash = num;
    });

    $('#changelayer').click(function() {
        var layer = $('#hlayers').val().split(',').map(function(i) { return i | 0; });
        var num = $('#demos option:selected').val() | 0;
        demo.deinit();
        demo = new Demos[num](layer);
    });

    $('input[type=range]').mousemove(function() {
        $('#' + this.id + 'view').html(this.value);
    });

    $('#init').click(function() {
        demo.reset();
    });

    $('#train').click(function() {
        var button = $(this);
        switch (demo.state) {
        case DemoBase.State.BEFORE_TRAIN:
        case DemoBase.State.TRAINED:
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

    $('input[name=speed]').change(function() {
        demo.speed = this.value | 0;
    });

    var demosNum = location.hash.slice(1) | 0;
    if (demosNum < 1 || demosNum > 3) demosNum = 1;
    demo = new Demos[demosNum]();
    $('#demos').val(demosNum);
});

