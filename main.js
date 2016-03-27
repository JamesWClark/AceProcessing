/* JUST WOW - https://www.tinymce.com/ */

var editor;
var numFiles = 0;

var verifyFileAPISupport = function() {
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      // Great success! All the File APIs are supported.
    } else {
        $('#support-message').show();
        $('#support-message').text('The File APIs are not fully supported in this browser.');
    }    
};

var processFile = function(event, file) {
    var code = event.target.result;
    console.log(file.name);
    setNewSketch(code);
    setEditorCode(code);
};

var processFiles = function(files) {
    numFiles = files.length;
    for(var i = 0; i < files.length; i++) {
        var f = files[i];
        var reader = new FileReader();
        reader.onloadend = (function(file) {
            return function(event) {
                processFile(event, file);
            };
        })(f);
        reader.readAsText(f);
    }
};

var onFilesSelected = function(event) {
    var files = event.target.files; // FileList object
    processFiles(files);
};

var registerHandlers = function() {
    document.getElementById('files').addEventListener('change', onFilesSelected, false);
};

var setEditorCode = function(code) {
    editor.getSession().setValue(code);
};

var setNewSketch = function(code) {
    Processing.getInstanceById('sketch').exit();
    var container = $('#canvas-container');
    var canvas = document.createElement('canvas');
    canvas.id = 'sketch';
    container.html('');
    container.append(canvas);
    new Processing(canvas, code);
};

$(document).ready(function() {
    verifyFileAPISupport();
    registerHandlers();
    
    var initcode = $('#processing-code').text();
    editor = ace.edit("editor");
    editor.$blockScrolling = Infinity;
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/java");
    
    setEditorCode(initcode);
    
    $('#run').click(function() {
        var code = editor.getSession().getValue();
        setNewSketch(code);
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