/* JUST WOW - https://www.tinymce.com/ */

$(document).ready(function() {
    var initcode = $('#processing-code').text();
    var editor = ace.edit("editor");
    editor.$blockScrolling = Infinity;
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/java");
    editor.getSession().setValue(initcode);
    
    $('#run').click(function() {
        Processing.getInstanceById('sketch').exit();
        var code = editor.getSession().getValue();
        var container = $('#canvas-container');
        var canvas = document.createElement('canvas');
        canvas.id = 'sketch';
        container.html('');
        container.append(canvas);
        new Processing(canvas, code);
    });
});

/* properties of Processing object
debug
main.js:20 instances
main.js:20 getInstanceById
main.js:20 compile
main.js:20 logger
main.js:20 version
main.js:20 lib
main.js:20 registerLibrary
main.js:20 Sketch
main.js:20 loadSketchFromSources
main.js:20 reload
main.js:20 disableInit
*/