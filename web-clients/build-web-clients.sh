#!/bin/bash
# Build web clients from all default configs of query-sparql-reasoning

# Exit when any command fails
set -e

cwd=$(pwd)
mkdir -p $cwd/web-clients/builds
pushd engines/query-sparql-reasoning >/dev/null
for config in ../config-reasoning/config/*.json; do
  id=$(echo $config | sed "s/.*config\/config-\(.*\)\.json/\1/")

  if [ "$id" = "base" ] || [ "$id" = "solid-base" ] || [ "$id" = "file" ] || [ "$id" = "rdfjs" ]; then
    continue;
  fi

  cat $cwd/web-clients/settings.json | \
    sed "s/__SUBTITLE__/Using $id config/; s~__SUBTITLE_HREF__~https://github.com/comunica/comunica-feature-reasoning/blob/$GITHUB_SHA/engines/config-reasoning/config/config-$id.json~" \
    > $cwd/web-clients/settings.custom.json

  # Build web client
  echo -e "\033[1m\033[34mBuilding config $id\033[0m"
  npx -p @comunica/web-client-generator@1.5.4 comunica-web-client-generator $config \
    -d $cwd/web-clients/builds/$id \
    -s $cwd/web-clients/settings.custom.json \
    -q $cwd/web-clients/queries

  rm $cwd/web-clients/settings.custom.json
done
popd >/dev/null

# Copy build index file
cp $cwd/web-clients/overview.html $cwd/web-clients/builds/index.html
