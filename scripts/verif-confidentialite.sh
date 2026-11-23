#!/usr/bin/env sh
# Relecture de confidentialité avant publication.
# Cherche les mots de reference/mots-interdits.txt (hors de git) dans les fichiers suivis par git,
# puis dans le site construit (dist/). Échoue si la liste manque, si dist/ manque ou si un mot est trouvé.
set -u
cd "$(dirname "$0")/.." || exit 2
LISTE=reference/mots-interdits.txt

if [ ! -s "$LISTE" ]; then
  echo "Échec : $LISTE est absent ou vide. Relecture impossible."
  exit 2
fi
if [ ! -d dist ]; then
  echo "Échec : dist/ est absent. Lancez d'abord npm run build."
  exit 2
fi
# Lignes vides ou espaces seuls retirées : elles trouveraient tout.
MOTIFS=$(mktemp)
trap 'rm -f "$MOTIFS"' EXIT
tr -d '\r' < "$LISTE" | grep -v '^[[:space:]]*$' > "$MOTIFS"

echo "Mots recherchés : $(wc -l < "$MOTIFS")"
echo "1. Fichiers suivis par git"
if git grep -n -i -F -f "$MOTIFS"; then
  echo "Échec : mot interdit dans un fichier suivi par git."
  exit 1
fi
echo "   rien trouvé"
echo "2. Site construit (dist/)"
if grep -r -n -i -F -f "$MOTIFS" dist/; then
  echo "Échec : mot interdit dans dist/."
  exit 1
fi
echo "   rien trouvé"
echo "3. reference/ hors de git"
if [ -n "$(git ls-files reference)" ]; then
  echo "Échec : des fichiers de reference/ sont suivis par git."
  exit 1
fi
echo "   oui"
echo "Relecture de confidentialité : rien à signaler."
