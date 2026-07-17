@Get("planning")
async getPlanning(@Req() req, @Query("date") date: string) {
  const workspaceId = req.headers["x-workspace-id"];
  return this.garageService.getPlanning(String(workspaceId), date);
}
