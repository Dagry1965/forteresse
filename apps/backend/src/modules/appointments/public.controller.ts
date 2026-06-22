@Controller('public/appointments')
export class PublicAppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  async publicBooking(@Body() dto: PublicBookingDto) {
    // Logique : 
    // 1. Trouver ou Créer le Client
    // 2. Trouver ou Créer le Véhicule
    // 3. Créer le RDV avec status: 'pending' et source: 'online'
    return this.appointmentService.createPublic(dto);
  }
}
