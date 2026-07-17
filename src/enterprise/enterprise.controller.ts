@Get(":id/dashboard")
async getDashboard(@Param("id") companyId: string) {
  return this.enterpriseService.getDashboard(companyId);
}
