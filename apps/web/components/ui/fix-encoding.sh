#!/bin/bash

ROOT="/c/Users/Admin/forteresse"

echo "🔧 Correction MULTI-ENCODAGE dans tout le projet : $ROOT"

EXT="-name *.ts -o -name *.tsx -o -name *.js -o -name *.jsx -o -name *.json -o -name *.md -o -name *.txt -o -name *.html -o -name *.css"

# Séquences cassées les plus fréquentes (simple, double, triple encodage)
BROKEN_REGEX="Ã.|â.|Â.|ð.|ø.|þ.|Ãƒ.|Ã‚.|Ã¢.|Ã¤.|Ãª.|Ã¢â€š.|Ã¢â‚¬.|Ã¢â€ž."

find "$ROOT" -type f \( $EXT \) 2>/dev/null | while read file; do
  echo "➡️  Vérification : $file"

  if grep -q -E "$BROKEN_REGEX" "$file"; then
    echo "   ⚠️  Encodage cassé détecté → tentative de réparation…"

    # Essais successifs
    for enc in "ISO-8859-1" "WINDOWS-1252" "CP1252"; do
      iconv -f "$enc" -t UTF-8 "$file" -o "$file.tmp" 2>/dev/null

      if [ $? -eq 0 ]; then
        # Vérifier si la conversion a supprimé les séquences cassées
        if ! grep -q -E "$BROKEN_REGEX" "$file.tmp"; then
          mv "$file.tmp" "$file"
          echo "   ✔️  Corrigé avec encodage : $enc"
          break
        fi
      fi
    done

    # Tentative de double conversion (cas extrêmes)
    if grep -q -E "$BROKEN_REGEX" "$file"; then
      iconv -f UTF-8 -t ISO-8859-1 "$file" -o "$file.tmp2" 2>/dev/null
      iconv -f ISO-8859-1 -t UTF-8 "$file.tmp2" -o "$file.tmp3" 2>/dev/null

      if [ -f "$file.tmp3" ] && ! grep -q -E "$BROKEN_REGEX" "$file.tmp3"; then
        mv "$file.tmp3" "$file"
        echo "   ✔️  Corrigé via double conversion"
      fi

      rm -f "$file.tmp2" "$file.tmp3"
    fi

    rm -f "$file.tmp"
  fi
done

echo "✅ Correction MULTI-ENCODAGE terminée."
