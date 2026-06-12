# Forcer l'encodage UTF-8 pour éviter les caractères cassés
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Définir le chemin cible
$targetPath = "C:\Users\Admin\forteresse\apps\backend\prisma"

# Créer le dossier prisma s'il n'existe pas
New-Item -ItemType Directory -Force -Path $targetPath | Out-Null

# Chemin complet du fichier
$schemaFile = Join-Path $targetPath "schema.prisma"

# Contenu du fichier Prisma
@"
generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email     String   @unique
  password  String?
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  memberships WorkspaceMember[]
}

model Workspace {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name      String
  ownerId   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  members   WorkspaceMember[]
}

model WorkspaceMember {
  id          String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user        User   @relation(fields: [userId], references: [id])
  userId      String @db.Uuid
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  workspaceId String @db.Uuid
  role        String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Client {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId String   @db.Uuid
  name        String
  email       String?
  phone       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  vehicles    Vehicle[]
  @@index([workspaceId])
}

model Vehicle {
  id          String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId String  @db.Uuid
  clientId    String  @db.Uuid
  vin         String? @unique
  plateNumber String?
  make        String?
  model       String?
  year        Int?
  mileage     Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  client      Client  @relation(fields: [clientId], references: [id])
  @@index([workspaceId, clientId])
}
"@ | Set-Content -Path $schemaFile -Encoding UTF8

Write-Host "`u2714 Fichier schema.prisma créé dans $schemaFile"
