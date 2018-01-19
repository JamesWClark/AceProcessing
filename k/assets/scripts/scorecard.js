var ScoreCard = function() {
    
    var self = this;
    
    var resultId = null;
    var rABS = true; // true: readAsBinaryString ; false: readAsArrayBuffer
    
    var students = {};
    var assignments = {};

    var log = function(msg, obj) {
        var debug = true;
        if(debug) {
            console.log('\n');
            if(typeof obj === 'object') console.log(msg, JSON.stringify(obj));
            else if(obj) console.log(msg, obj);
            else console.log(msg);
        }
    };
    
    var mineStudents = function(worksheet, column) {
        if(worksheet[column] && worksheet[column].v) {
            worksheet[column].v.split('\n').forEach(function(ele) {
                students[ele] = {
                    assignments : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
                };
            });  
        }
    };
    
    students.toArray = function() {
        var a = [];
        for (var key in students) {
            if (students.hasOwnProperty(key)) {
                //a.push({ name : key, assignments})
                log(key + " -> ", students[key]);
            }
        }
        return a;
    };
    
    var receiveDrop = function(e) {
        e.stopPropagation();
        e.preventDefault();
        var files = e.dataTransfer.files, f = files[0];
        var reader = new FileReader();
        reader.onload = function (e) {
            var data = e.target.result;
            if (!rABS) data = new Uint8Array(data);
            
            var workbook = XLSX.read(data, { type: rABS ? 'binary' : 'array' });
            var worksheetName = workbook.SheetNames[0];
            var worksheet = workbook.Sheets[worksheetName];

            mineStudents(worksheet, 'B2');
            mineStudents(worksheet, 'C2');
            mineStudents(worksheet, 'D2');

            // todo: make this dynamic
            const START = 3; // What is Programming?
            const STOP = 96; // Project: Bookshelf
            for(var i = START; i <= STOP; i++) {
                var assignmentName = worksheet['A' + i].v;
                var completionStatus = worksheet['D' + i];
                if(completionStatus && completionStatus.v) {
                    completionStatus.v.split('\n').forEach(function(ele) {
                        var unit = assignments[assignmentName];
                        students[ele].assignments[unit]++;
                    });
                }
            }
            
            log('after parsing, students = ', students);

            writeScores();
        };
        if (rABS) reader.readAsBinaryString(f);
        else reader.readAsArrayBuffer(f);
    }
    
    var writeScores = function() {
        var html = '';
        html += '<table><tr><th>Student Name</th>';

        for(var i = 0; i < 16; i++) {
            html += '<th>U' + (i) + '</th>';
        }
        html += '</tr>';

        for (var key in students) {
            if (students.hasOwnProperty(key)) {
                var arr = students[key].assignments;
                if(arr && arr.length) {
                    html += '<tr><td id="student-name">' + key + '</td>';
                    for(var i = 0; i < arr.length; i++) {
                        html += '<td>' + arr[i] + '</td>';
                    }
                    html += '</tr>';
                }
            }
        }

        html += '</table>';

        document.getElementById('result').innerHTML = html;
    }
    
    self.loadAssignments = function(file) {
        $.get(file, function (data) {
            log('parsing data = ', data);
            var lines = data.split('\n');
            lines.forEach(function (line) {
                if (line.length > 0) {
                    var columns = line.trim().split('\t');
                    var unit = columns[0];
                    var name = columns[1];
                    assignments[name] = parseInt(unit);
                }
            });
            log('loaded assignments = ', assignments);
        });
    };
    
    self.handleDrops = function(elementId) {
        document.getElementById(elementId).addEventListener('drop', receiveDrop, false);
    };
    
    self.writeTo = function(elementId) {
        resultId = elementId;
    };
}