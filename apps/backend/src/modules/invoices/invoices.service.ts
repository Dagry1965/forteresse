import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // HELPERS DE NORMALISATION
  // ---------------------------------------------------------
  private normalizeStatus(status: string | undefined | null): string {
    if (!status) return 'PENDING';
    return status.trim().toUpperCase();
  }

  private normalizeType(type: string | undefined | null): string {
    if (!type) return 'INVOICE'; 
    return type.trim().toUpperCase();
  }

  // ---------------------------------------------------------
  // CREATE INVOICE (Simple / Individuelle)
  // ---------------------------------------------------------
  async create(dto: any) {
    const status = this.normalizeStatus(dto.status);
    const type = this.normalizeType(dto.type);

    return this.prisma.invoice.create({
      data: {
        reference: dto.reference,
        total: dto.total,
        status,
        type,
        workspace: { connect: { id: dto.workspace_id } },
        client: { connect: { id: dto.client_id } },
        user: { connect: { id: dto.user_id } },
        ...(dto.proforma_id && { proforma: { connect: { id: dto.proforma_id } } }),
        ...(dto.appointment_id && { appointment: { connect: { id: dto.appointment_id } } }),
      },
      include: {
        client: true,
        user: true,
        proforma: true,
        appointment: true,
      },
    });
  }

  // ---------------------------------------------------------
  // CREATE GROUPED INVOICE (La méthode utilisée par Fleet/index.tsx)
  // Enrichie avec copie détaillée des lignes de chaque dossier
  // ---------------------------------------------------------
  async createGroupedInvoice(workspaceId: string, dto: { client_id: string, appointment_ids: string[] }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Récupérer les dossiers avec le détail complet (Pièces/Main d'oeuvre)
      const appointments = await tx.appointment.findMany({
        where: {
          id: { in: dto.appointment_ids },
          workspace_id: workspaceId
        },
        include: { 
          vehicle: true,
          proformas: {
            include: { lines: true } // On va chercher les lignes pour le détail
          } 
        }
      });

      if (appointments.length === 0) throw new BadRequestException("Aucun dossier trouvé.");

      // 2. Calculer le total global
      const totalAmount = appointments.reduce((sum, appt) => {
        const amount = appt.proformas?.[0]?.total || 0;
        return sum + Number(amount);
      }, 0);

      // 3. Utilisateur par défaut
      const defaultUser = await tx.user.findFirst({ where: { workspace_id: workspaceId } });
      if (!defaultUser) throw new NotFoundException("Utilisateur introuvable.");

      // 4. Créer la Facture Parente
      const invoice = await tx.invoice.create({
        data: {
          reference: `FLOTTE-${Date.now()}`,
          total: totalAmount,
          status: this.normalizeStatus('PENDING'),
          type: this.normalizeType('FLEET'),
          workspace_id: workspaceId,
          client_id: dto.client_id,
          user_id: defaultUser.id
        }
      });

      // 5. RECOPIE DU DÉTAIL DE CHAQUE DOSSIER DANS LES LIGNES DE FACTURE
      for (const appt of appointments) {
        const proforma = appt.proformas?.[0];
        
        // A. Ligne d'en-tête pour séparer les véhicules
        await tx.invoiceLine.create({
          data: {
            invoice_id: invoice.id,
            type: 'HEADER',
            label: `--- VÉHICULE : ${appt.vehicle?.registration} (${appt.vehicle?.brand}) ---`,
            quantity: 0, unit_price: 0, vat_rate: 0, discount: 0, total: 0
          }
        });

        // B. Copie des lignes réelles (Pièces, Main d'œuvre, etc.)
        if (proforma?.lines) {
          for (const line of proforma.lines) {
            await tx.invoiceLine.create({
              data: {
                invoice_id: invoice.id,
                type: line.type,
                label: line.label,
                quantity: line.quantity,
                unit_price: line.unit_price,
                vat_rate: line.vat_rate,
                discount: line.discount,
                total: line.total
              }
            });
          }
        }

        // C. Marquer le RDV comme facturé
        await tx.appointment.update({
          where: { id: appt.id },
          data: { status: this.normalizeStatus('INVOICED') }
        });
      }

      // 6. Création de l'échéancier automatique à 30 jours
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      await tx.paymentSchedule.create({
        data: {
          invoice_id: invoice.id,
          amount: totalAmount,
          due_date: dueDate,
          status: this.normalizeStatus('PENDING'),
          workspace_id: workspaceId
        }
      });

      return invoice;
    });
  }

  // ---------------------------------------------------------
  // FIND ONE & GET FULL INVOICE (Pour Impression PDF)
  // ---------------------------------------------------------
  async findOne(id: string, workspaceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, workspace_id: workspaceId },
      include: {
        client: true,
        user: { select: { name: true } },
        lines: { orderBy: { created_at: 'asc' } },
        payments: true
      },
    });
    if (!invoice) throw new NotFoundException(`Facture introuvable`);
    return invoice;
  }

  async getFullInvoice(id: string, workspaceId: string) {
    return this.findOne(id, workspaceId);
  }

  // ---------------------------------------------------------
  // LISTING & FILTRES
  // ---------------------------------------------------------
  async findAll(workspaceId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { workspace_id: workspaceId },
      include: {
        client: true,
        payments: true,
        Payment: true,
        paymentSchedules: {
          orderBy: { due_date: 'asc' }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return invoices.map(({ Payment, ...invoice }) => ({
      ...invoice,
      payments: [
        ...(invoice.payments ?? []),
        ...(Payment ?? [])
      ]
    }));
  }

  async findUnpaidInvoices(workspaceId: string) {
    return this.prisma.invoice.findMany({
      where: {
        workspace_id: workspaceId,
        status: this.normalizeStatus('PENDING'),
      },
      include: {
        client: true,
        user: { select: { name: true } },
      },
    });
  }

  // ---------------------------------------------------------
  // MÉTHODES DE COMPATIBILITÉ (Gardées pour ne rien casser)
  // ---------------------------------------------------------
  async createFleetInvoice(workspaceId: string, clientId: string) {
    // Version simplifiée pour un seul client
    return this.prisma.$transaction(async (tx) => {
      const pendingCases = await tx.case.findMany({
        where: { workspace_id: workspaceId, customer_id: clientId, status: 'COMPLETED' },
        include: { proformas: true },
      });
      if (pendingCases.length === 0) throw new Error("Aucun dossier trouvé.");
      const totalAmount = pendingCases.reduce((sum, c) => sum + (c.proformas[0]?.total || 0), 0);
      return tx.invoice.create({
        data: {
          reference: `FLOTTE-${Date.now()}`,
          total: totalAmount,
          status: 'PENDING',
          type: 'FLEET',
          workspace_id: workspaceId,
          client_id: clientId,
        },
      });
    });
  }

  async createGroupedFleetInvoice(workspaceId: string, dto: { client_id: string; appointment_ids: string[] }) {
    // Redirige vers la nouvelle logique détaillée
    return this.createGroupedInvoice(workspaceId, dto);
  }

  // ---------------------------------------------------------
  // UPDATE & REMOVE
  // ---------------------------------------------------------
  async update(id: string, dto: any) {
    const data: any = { ...dto };
    if ('status' in dto) data.status = this.normalizeStatus(dto.status);
    if ('type' in dto) data.type = this.normalizeType(dto.type);
    return this.prisma.invoice.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.invoice.delete({ where: { id } });
  }
}
