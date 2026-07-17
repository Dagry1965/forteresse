# ================================================
# setup-invoices.ps1 - Version corrigée
# ================================================

Write-Host "🚀 Création du module Facturation Groupée..." -ForegroundColor Cyan

$baseDir = ".\src\modules\invoices"

# 1. Créer le dossier principal
if (-not (Test-Path $baseDir)) {
    New-Item -Path $baseDir -ItemType Directory -Force | Out-Null
    Write-Host "✅ Dossier créé : $baseDir" -ForegroundColor Green
}

# 2. Créer le dossier DTO
$dtoDir = Join-Path $baseDir "dto"
if (-not (Test-Path $dtoDir)) {
    New-Item -Path $dtoDir -ItemType Directory -Force | Out-Null
}

# 3. Créer le fichier DTO
$dtoContent = @'
import { IsNotEmpty, IsUUID, IsOptional, IsISO8601 } from 'class-validator';

export class CreateGroupedInvoiceDto {
  @IsUUID('4', { message: "L'identifiant de l'entreprise est invalide." })
  @IsNotEmpty({ message: "L'identifiant de l'entreprise est obligatoire." })
  companyId: string;

  @IsOptional()
  @IsISO8601({}, { message: 'La date de début doit être au format ISO.' })
  startDate?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'La date de fin doit être au format ISO.' })
  endDate?: string;
}
'@

Set-Content -Path (Join-Path $dtoDir "create-grouped-invoice.dto.ts") -Value $dtoContent -Encoding UTF8
Write-Host "✅ DTO créé" -ForegroundColor Green

# 4. Créer le Service
$serviceContent = @'
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateGroupedInvoiceDto } from './dto/create-grouped-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async createGroupedInvoice(dto: CreateGroupedInvoiceDto) {
    const { companyId, startDate, endDate } = dto;

    const appointments = await this.prisma.appointment.findMany({
      where: {
        vehicle: { clientId: companyId },
        invoiceId: null,
        ...(startDate || endDate
          ? {
              scheduled_at: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            }
          : {}),
      },
      include: { intervention: true },
    });

    if (!appointments || appointments.length === 0) {
      throw new NotFoundException('Aucun rendez-vous trouvé pour la facturation groupée.');
    }

    let totalAmount = 0;
    appointments.forEach(appt => {
      if (appt.intervention?.amount) totalAmount += appt.intervention.amount;
    });

    const invoice = await this.prisma.invoice.create({
      data: {
        companyId,
        totalAmount,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        type: 'grouped',
      },
    });

    await Promise.all(
      appointments.map(appt =>
        this.prisma.appointment.update({
          where: { id: appt.id },
          data: { invoiceId: invoice.id },
        })
      )
    );

    return invoice;
  }
}
'@

Set-Content -Path (Join-Path $baseDir "invoices.service.ts") -Value $serviceContent -Encoding UTF8
Write-Host "✅ Service créé" -ForegroundColor Green

# 5. Créer le Contrôleur
$controllerContent = @'
import { Controller, Post, Body } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateGroupedInvoiceDto } from './dto/create-grouped-invoice.dto';

@Controller('admin/invoices')
export class InvoicesAdminController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('grouped')
  async createGroupedInvoice(@Body() dto: CreateGroupedInvoiceDto) {
    return this.invoicesService.createGroupedInvoice(dto);
  }
}
'@

Set-Content -Path (Join-Path $baseDir "invoices.admin.controller.ts") -Value $controllerContent -Encoding UTF8
Write-Host "✅ Contrôleur créé" -ForegroundColor Green

# 6. Créer le Module
$moduleContent = @'
import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesAdminController } from './invoices.admin.controller';

@Module({
  controllers: [InvoicesAdminController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
'@

Set-Content -Path (Join-Path $baseDir "invoices.module.ts") -Value $moduleContent -Encoding UTF8
Write-Host "✅ Module créé" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Module Invoices créé avec succès !" -ForegroundColor Green
Write-Host "N'oublie pas d'importer InvoicesModule dans ton AppModule." -ForegroundColor Yellow