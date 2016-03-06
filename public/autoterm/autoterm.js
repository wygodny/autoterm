var term;
var socket = io(location.origin, {path: '/autoterm/socket.io'})
var buf = '';

function autoterm(argv) {
    this.argv_ = argv;
    this.io = null;
    this.pid_ = -1;
}

autoterm.prototype.run = function() {
    this.io = this.argv_.io.push();

    this.io.onVTKeystroke = this.sendString_.bind(this);
    this.io.sendString = this.sendString_.bind(this);
    this.io.onTerminalResize = this.onTerminalResize.bind(this);
}

autoterm.prototype.sendString_ = function(str) {
    socket.emit('input', str);
};

autoterm.prototype.onTerminalResize = function(col, row) {
    socket.emit('resize', { col: col, row: row });
};

socket.on('connect', function() {
    socket.emit("getSessionsList")

    lib.init(function() {
        hterm.defaultStorage = new lib.Storage.Local();
        term = new hterm.Terminal();
        window.term = term;
        term.decorate(document.getElementById('terminal'));

        term.setCursorPosition(0, 0);
        term.setCursorVisible(true);
        term.prefs_.set('ctrl-c-copy', true);
        term.prefs_.set('ctrl-v-paste', true);
        term.prefs_.set('use-default-window-copy', true);

        term.runCommandClass(autoterm, document.location.hash.substr(1));
        socket.emit('resize', {
            col: term.screenSize.width,
            row: term.screenSize.height
        });

        if (buf && buf != '')
        {
            term.io.writeUTF16(buf);
            buf = '';
        }
    });


    $(function () {
        $('#add-new-session-form').submit(function (e) {
            e.preventDefault()
            var data = {
                name: $('[name="add-new-session-form-name"]').val(),
                host: $('[name="add-new-session-form-host"]').val(),
                user: $('[name="add-new-session-form-user"]').val(),
                pass: $('[name="add-new-session-form-pass"]').val()            
            }

            socket.emit('addNewSession', data, function () {

            })
        })
    })
});

socket.on('output', function(data) {
    if (!term) {
        buf += data;
        return;
    }
    term.io.writeUTF16(data);
});

socket.on('disconnect', function() {
    console.log("Socket.io connection closed");
});

socket.on('sessionsList', function(data) {
    console.log(data);
    updateSessionsList(data)
});

socket.on('newSessionAdded', function(data) {
    console.log(data);
    addToSessionsList(data)
});


var updateSessionsList = function (sessions) {
    clearSessionsList()
    $.each(sessions, function( index, value ) {
        addToSessionsList(value)
    });
}

var addToSessionsList = function (session) {
    var $a = $("<a>", {
        id: "session-link-"+session._id, 
        class: "list-group-item", 
        href: "#", 
        text: session.name
    });

    $a.click(function(){ 
        alert(session._id)
    });

    $("#sessions-list").append($a);
}

var clearSessionsList = function (sessions) {
    $("#sessions-list").html("");
}


