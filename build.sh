#!/bin/bash



function die() {
    echo "$1" >&2
    exit 1
}

if [[ ! -z "$2" ]]; then
    for i in "$@"; do
        bash build.sh "$i" || die "[ERROR] Some problem happaned."
    done
    exit $?
fi


case $1 in
    .tg-data/*/result.json)
        ### From JSON to data tex
        ACTION=tex node src/journal.js "$1"
        ;;
    data/output_tex_code/*.tex)
        ### From data tex to real tex
        issue_id="$(cut -d/ -f3 <<< "$1" | cut -d. -f1)"
        sed "s|__issue_id__|$issue_id|g" .texlib/journal-v1.tex > "journal/AOSC_Memes_Collection-$issue_id.tex"
        ;;
    journal/*.tex)
        ### Compile real tex to PDF
        issue_id="$(cut -d- -f2 <<< "$1" | cut -d. -f1)"
        bash "$0" "data/output_tex_code/$issue_id.tex"
        ntex "$1"
        ACTION=authors bash "$0" ".tg-data/$issue_id/result.json"
        ;;
    journal/*.tex!)
        ### Do some preparation work then build PDF
        issue_id="$(cut -d- -f2 <<< "$1" | cut -d. -f1)"
        ACTION=tex bash "$0" ".tg-data/$issue_id/result.json"
        bash "$0" "$(tr -d '!' <<< "$1")"
        ;;
esac
