let output = document.getElementById('output');
let input = document.getElementById('input');
let editor = document.getElementById('editor');
let stdin = '';
let stdinPosition = 0;

// We use this to provide data into the SWI stdin.
const setStdin = (string) => {
    stdin = string;
    stdinPosition = 0;
};
const readStdin = () => {
    if (stdinPosition >= stdin.length) {
        console.log(Module.prolog.ttymode());
        if ( Module.prolog.ttymode() == "raw" )
            console.log("It raw mode");
        return null;
    } else {
        const code = stdin.charCodeAt(stdinPosition);
        stdinPosition++;
        return code;
    }
};

function print_line(line, cls) {
    const node = document.createElement('div');
    node.className = cls;
    node.textContent = line;
    output.appendChild(node);
};

function pl(s) {
    Module.prolog.call_string(s);
}

function query(query) {
    if ( ! /\.\s*/.test(query) )
    query += ".\n";
    print_line(`?- ${query}`, 'query');
    setStdin(query);
    pl('break');
}

// https://www.swi-prolog.org/pldoc/man?predicate=consult/1
input.addEventListener('submit', (e) => {
    query("consult('./eye.pl').");
    e.preventDefault();
    query(e.target.elements.query.value);
    e.target.elements.query.value = '';
}, false);

function bindStdin(module) {
    module.FS.init(readStdin);
}

var Module = {
    noInitialRun: true,
    arguments: [],
    locateFile: function(file) {
    return './' + file;
    },
    print: (line) => print_line(line, 'stdout'),
    printErr: (line) => print_line(line, 'stderr'),
    preRun: [() => bindStdin(Module)]
};

async function fetchWrite(link, file) {
    const response = await fetch(link);
    await Module.FS.writeFile(file, await response.text());
}

SWIPL(Module).then(async (module) => {
    await fetchWrite('https://josd.github.io/eye/eye.pl', '/eye.pl');
    await fetchWrite('https://josd.github.io/eye/reasoning/socrates/socrates.n3', 'socrates.n3');
    await fetchWrite('https://josd.github.io/eye/reasoning/socrates/socrates-query.n3', 'socrates-query.n3');

    pl("format('SWI-Prolog WebAssembly ready!~n')");
    pl("set_prolog_flag(tty_control, true)");
});