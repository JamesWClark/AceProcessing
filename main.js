/* FOLDER DROP - view-source:http://protonet.github.io/plupload/examples/drag_and_drop.html */
/* ZIP - https://stuk.github.io/jszip/documentation/howto/read_zip.html */

// ZipObject API
// https://stuk.github.io/jszip/documentation/api_zipobject.html

var editor;
var editorFontSize = 14;
var numFiles = 0;
var numFilesProcessed = 0;
var collection = []; // the files collection, whether zip or otherwise
var windex = 0; // used by arrow keys to set the current index
var requireZip = true; // depends on state of the checkbox #cb-require-zip

// logger that prevents circular object reference in javascript
var log = function(msg, obj) {
    console.log('\n');
    if(obj) {
        try {
            console.log(msg + JSON.stringify(obj));
        } catch(err) {
            var simpleObject = {};
            for (var prop in obj ){
                if (!obj.hasOwnProperty(prop)){
                    continue;
                }
                if (typeof(obj[prop]) == 'object'){
                    continue;
                }
                if (typeof(obj[prop]) == 'function'){
                    continue;
                }
                simpleObject[prop] = obj[prop];
            }
            console.log('circular-' + msg + JSON.stringify(simpleObject)); // returns cleaned up JSON
        }        
    } else {
        console.log(msg);
    }
};

// call this every time new files are uploaded
var reset = function() {
    collection = [];
    numFiles = 0;
    numFilesProcessed = 0;
    windex = 0;
};

// checks if the user's web browser supports all necessary apis
var verifyFileAPISupport = function() {
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      // Great success! All the File APIs are supported.
    } else {
        $('#support-message').show();
        $('#support-message').text('The File APIs are not fully supported in this browser.');
    }    
};

// checks if all the files are finished processing
var continueProcessing = function() {
    numFilesProcessed++;
    
    // we're done processing files - load the first one
    if(numFilesProcessed === numFiles) {
        console.log(collection);
        pimp(0);
    }
};

// process a single file
var processFile = function(event, file) {
    // split filename into array parts for extension detection
    var a = file.name.split('.');
    
    // if the filename has an extension
    if (a.length > 1) {
        var ext = a.pop(); // the extension is the last element of the array
        switch(ext) {
            case 'pde':
                if(!requireZip) {
                    collection.push({
                        name : file.name,
                        code : event.target.result
                    });
                    continueProcessing();
                }
                break;
            case 'zip':
                var compressed = new JSZip();
                compressed.loadAsync(file).then(function(contents) {
                    // contents is an array of compressed files
                    contents.forEach(function(path, zipObject) {
                        var isFolder = zipObject.dir;
                        if(isFolder) {
                            // do nothing
                        } else {
                            compressed.file(path).async('string').then(function(text) {
                                // repeating some code now - this is an internal validation of the zip file
                                // only add PDE for now
                                // TODO: fix #2 #3 and #4 here
                                var n = path.split('/').pop(); // name
                                var c = text; // file contents
                                var a = path.split('/').pop().split('.'); // parts split by periods
                                if(a.length > 1) {
                                    var ext = a.pop();
                                    switch(ext) {
                                        case 'pde':
                                            collection.push({
                                                name : n,
                                                code : c
                                            });
                                            break;
                                        default:
                                            // skip - do nothing
                                            break;
                                    }
                                }
                                continueProcessing();
                            });
                        }
                    });
                }, function() { // error handler
                    log('zip error?')
                });
                break;
            default:
                log('not a valid file format. should be .pde or .zip where file.name = ', file.name);
                break;
        }                    
    } else {
        log('not a valid file');
    }
};

// process all the dropped files
var processFiles = function(files) {
    requireZip = $('#cb-require-zip').prop('checked');
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

// fires when file(s) dropped
var onFilesSelected = function(event) {
    reset();
    var files = event.target.files; // FileList object
    processFiles(files);
};

// register file drop change
var registerHandlers = function() {
    document.getElementById('files').addEventListener('change', onFilesSelected, false);
};

// set the editor code
var setEditorCode = function(code) {
    editor.getSession().setValue(code);
};

// update canvas and editor with new code
var setNewSketch = function(code) {
    Processing.getInstanceById('sketch').exit();
    var container = $('#canvas-container');
    var canvas = document.createElement('canvas');
    canvas.id = 'sketch';
    container.html('');
    container.append(canvas);
    new Processing(canvas, code);
};

// called by keydown - flips through sketches and code
var pimp = function(index) {
    var f = collection[index];
    $('#file-name').text(index + ": " + f.name);
    try {
        $('.pjsconsole .console').html('boom');
        setNewSketch(f.code);
        $('#error-message').text('');
    } catch(err) {
        $('#error-message').text(err);
    }
    setEditorCode(f.code);
};

$(document).keydown(function(e){
    // left arrow
    if ((e.keyCode || e.which) == 37 && windex > 0) {   
        windex--;
        pimp(windex);
    }
    // right arrow
    if ((e.keyCode || e.which) == 39 && windex < collection.length - 1) {
        windex++;
        pimp(windex);
    }   
});

$(document).ready(function() {
    verifyFileAPISupport();
    registerHandlers();
    
    var initcode = $('#processing-code').text();
    editor = ace.edit("editor");
    editor.$blockScrolling = Infinity;
    editor.setTheme("ace/theme/monokai");
    editor.setFontSize(editorFontSize);
    editor.getSession().setMode("ace/mode/java");
    
    setEditorCode(initcode);
    
    // run the editor's code
    $('#run').click(function() {
        var code = editor.getSession().getValue();
        try {
            setNewSketch(code);
            $('#error-message').text('');
        } catch(err) {
            $('#error-message').text(err);
        }
    });
    
    // increase editor font size
    $('#fontup').click(function() {
        editor.setFontSize(++editorFontSize);
        $('#fontSize').text(editorFontSize);
    });
    
    // decrease editor font size
    $('#fontdown').click(function() {
        editor.setFontSize(--editorFontSize);
        $('#fontSize').text(editorFontSize);
    });
    
    // display the font size
    $('#fontSize').text(editorFontSize);
});