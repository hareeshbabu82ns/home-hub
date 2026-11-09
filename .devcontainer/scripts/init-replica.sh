#!/usr/bin/env bash
set -euo pipefail

echo "Waiting for MongoDB to accept connections..."
until mongosh --host mongo --port 27017 --quiet --eval "db.adminCommand({ ping: 1 }).ok" >/dev/null 2>&1; do
  sleep 1
done

echo "Ensuring replica set rs0 exists..."
mongosh --host mongo --port 27017 --quiet <<'EOF'
try {
  const status = rs.status();
  if (status.ok === 1) {
    print("Replica set already initialized.");
    quit(0);
  }
} catch (error) {
  // rs.status() throws when replica set is not initialized.
}

rs.initiate({
  _id: "rs0",
  members: [{ _id: 0, host: "mongo:27017" }],
});

print("Replica set initialization requested.");
EOF

echo "Waiting for primary election..."
until mongosh --host mongo --port 27017 --quiet --eval "db.hello().isWritablePrimary" | grep -q "true"; do
  sleep 1
done

echo "MongoDB replica set rs0 is ready."