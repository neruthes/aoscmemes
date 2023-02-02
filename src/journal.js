const { execSync } = require('child_process');
const fs = require('fs');

const json_fn = process.argv[2];
const collection_year = json_fn.match(/\d{4}/)[0]




const sanitizeLatexCode = function (inputText, opt) {
    if (!opt) {
        opt = {};
    };
    let tmp = inputText;

    // Some operations require explicit declaration
    if (opt.lf) { tmp = tmp.replace(/\n/g, ' ') };

    // Generic operations for all cases
    tmp = tmp.replace(/\&/g, '\\&');
    tmp = tmp.replace(/\_/g, '\\_');
    tmp = tmp.replace(/“/g, '``');
    tmp = tmp.replace(/”/g, `''`);
    tmp = tmp.replace(/‘/g, '`');
    tmp = tmp.replace(/’/g, `'`);
    tmp = tmp.replace(/\$/g, `\\$`);
    tmp = tmp.replace(/%/g, `\\%`);
    tmp = tmp.replace(/\#/g, `\\#`);
    return tmp;
}












const issue_data = JSON.parse(fs.readFileSync(json_fn).toString());


if (process.env.ACTION === 'authors') {
    const authors_dict = {};
    issue_data.messages.forEach(function (msg) {
        const nom = msg.forwarded_from || msg.author;
        const count = authors_dict[nom];
        authors_dict[nom] = count ? count + 1 : 1;
    });
    let authors_arr = Object.keys(authors_dict).map(a => ({ n: a, c: authors_dict[a] })).sort((a, b) => b.c - a.c);
    console.log(authors_arr);
};


if (process.env.ACTION === 'tex') {
    const output_tex_code = issue_data.messages.filter(x => x.media_type !== 'sticker').map(function (msg) {
        let text = msg.text;
        if (typeof text !== 'string') {
            text = msg.text.map(function (x) {
                if (typeof x === 'string') {
                    return x;
                } else {
                    return `<${x.type}>${x.text}</${x.type}>`;
                };
            }).join('');
        };
        const text2 = execSync('pandoc -t latex', { input: text }).toString().trim();
        const msg_info = {
            // type: msg.type,
            // author: msg.author,
            media_type: msg.media_type,
            date: msg.date.replace('T', ' '),
            forwarded_from: msg.forwarded_from,
            text2: text2,
            msg: msg
        };
        return `
\\channelMsgEntry{%
    \\msgRealSource{${sanitizeLatexCode(msg_info.forwarded_from || msg_info.msg.author)}}{${msg_info.date}}%
    \\msgMainContent{${msg_info.text2.trim()}}%
    ${msg_info.msg.photo ? `\\nopagebreak\\includegraphics[width=\\linewidth]{./.tg-data/${collection_year}/${msg_info.msg.photo}}` : ''}%
}`;
    }).join('\n\n');

    const tex_fn = `data/output_tex_code/${collection_year}.tex`;
    fs.writeFileSync(tex_fn, output_tex_code);

    console.log(`Wrote output to file: ${tex_fn}`);

}


