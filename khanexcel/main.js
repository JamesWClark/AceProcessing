var rABS = true; // true: readAsBinaryString ; false: readAsArrayBuffer
var html = '';
var students = {};
var assignments = {};

function log(msg) {
    console.log(msg);
}

// parses pace.tsv to dictionary for assignment name to unit
var loadPace = function () {
    $.get('pace.tsv', function (data) {
        var lines = data.split('\n');
        lines.forEach(function (ele) {
            if (ele.length > 0) {
                var parts = ele.trim().split('\t');
                var unit = parts[0];
                var name = parts[1];
                assignments[name] = parseInt(unit);
            }
        })
    });
};

function buildResultsHtml() {
    var html = '';
    html += '<table><tr><th>Student Name</th>';
    
    for(var i = 0; i < 16; i++) {
        html += '<th>U' + (i) + '</th>';
    }
    html += '</tr>';
    
    for (var key in students) {
        if (students.hasOwnProperty(key)) {
            var arr = students[key].assignments;
            html += '<tr><td id="student-name">' + key + '</td>';
            for(var i = 0; i < arr.length; i++) {
                html += '<td>' + arr[i] + '</td>';
            }
            html += '</tr>';
        }
    }
    
    html += '</table>';
    
    document.getElementById('result').innerHTML = html;
}

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    var files = e.dataTransfer.files
        , f = files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
        var data = e.target.result;
        if (!rABS) data = new Uint8Array(data);
        var workbook = XLSX.read(data, {
            type: rABS ? 'binary' : 'array'
        });
        
        var popStudents = function(worksheet) {
            // eg: https://docs.google.com/spreadsheets/d/1VRsJnpSmTZMa1m4xyPw5Q7UDr7iWkxipaOArwp9758g/edit#gid=1238507608
            
            if(worksheet['B2'] && worksheet['B2'].v) {
                worksheet['B2'].v.split('\n').forEach(function(ele) {
                    students[ele] = {
                        assignments : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
                    };
                });  
            }
            
            if(worksheet['C2'] && worksheet['C2'].v) {
                worksheet['C2'].v.split('\n').forEach(function(ele) {
                    students[ele] = {
                        assignments : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
                    };
                });  
            }
            
            if(worksheet['D2'] && worksheet['D2'].v) {
                worksheet['D2'].v.split('\n').forEach(function(ele) {
                    students[ele] = {
                        assignments : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
                    };
                });  
            }
        };
        
        var first_sheet_name = workbook.SheetNames[0];
        var worksheet = workbook.Sheets[first_sheet_name];
        
        popStudents(worksheet);
        log('just populated students = ' + JSON.stringify(students));

        
        const START = 3; // What is Programming?
        const STOP = 96; // Project: Bookshelf
        for(var i = START; i <= STOP; i++) {
            var name = worksheet['A' + i].v;
            var completed = worksheet['D' + i];
            if(completed && completed.v) {
                completed.v.split('\n').forEach(function(ele) {
                    var unit = assignments[name];
                    students[ele].assignments[unit]++;
                });  
            }
        }
        
        buildResultsHtml();
    };
    if (rABS) reader.readAsBinaryString(f);
    else reader.readAsArrayBuffer(f);
}

loadPace();
document.getElementById('files').addEventListener('drop', handleDrop, false);