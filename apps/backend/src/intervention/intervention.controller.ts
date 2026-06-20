import { Controller, Post, Body, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { InterventionService } from './intervention/intervention.service';
import { CreateInterventionDto } from './intervention/dto/create-intervention.dto';

@Controller('api/interventions')
export class InterventionController {
  constructor(private readonly service: InterventionService) {}

  /**
   * 1. DÉMARRER UNE INTERVENTION DEPUIS UN RDV
   * Cette route est appelée par le bouton "Démarrer Travaux" du Frontend
   */
  @Post('from-appointment/:appointmentId')
  async createFromAppointment(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: CreateInterventionDto
  ) {
    // On délègue la logique de bascule et de transaction au service
    return this.service.createFromAppointment(appointmentId, dto);
  }

  /**
   * 2. LISTER LES INTERVENTIONS (Atelier)
   * Utilisé pour afficher le planning des travaux en cours
   */
  @Get()
  async list(@Query('workspaceId') workspaceId: string) {
    if (!workspaceId) {
      throw new BadRequestException("L'identifiant d'espace de travail (workspaceId) est requis.");
    }
    return this.service.findAll(workspaceId);
  }

  /**
   * 3. VOIR LE DÉTAIL D'UNE INTERVENTION
   * Permet au mécanicien de voir la fiche complète : client, véhicule, et diagnostic
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /**
   * 4. CRÉATION DIRECTE (Optionnel)
   * Si jamais on veut créer une intervention sans rendez-vous préalable
   */
  @Post()
  async create(@Body() dto: CreateInterventionDto) {
    // Cette méthode peut appeler une méthode générique du service si besoin
    // Pour l'instant, on privilégie le flux métier "depuis rendez-vous"
    return this.service.createFromAppointment(dto.appointment_id, dto);
  }
}
