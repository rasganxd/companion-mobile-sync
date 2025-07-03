
interface LocalSalesRep {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  password: string;
  active: boolean;
}

export class LocalSalesRepsManager {
  private static STORAGE_KEY = 'local_sales_reps';

  static saveLocalSalesReps(salesReps: LocalSalesRep[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(salesReps));
      console.log('✅ Local sales reps saved successfully');
    } catch (error) {
      console.error('❌ Error saving local sales reps:', error);
    }
  }

  static getLocalSalesReps(): LocalSalesRep[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const savedReps = JSON.parse(data);
        return savedReps;
      }
    } catch (error) {
      console.error('❌ Error loading local sales reps:', error);
    }

    // Retornar array vazio se não houver dados salvos
    console.log('📭 No local sales reps data found, returning empty array');
    return [];
  }

  static addOrUpdateSalesRep(salesRep: LocalSalesRep): void {
    const existingSalesReps = this.getLocalSalesReps();
    const existingIndex = existingSalesReps.findIndex(rep => rep.code === salesRep.code);
    
    if (existingIndex >= 0) {
      existingSalesReps[existingIndex] = salesRep;
    } else {
      existingSalesReps.push(salesRep);
    }
    
    this.saveLocalSalesReps(existingSalesReps);
  }

  static removeSalesRep(code: string): void {
    const existingSalesReps = this.getLocalSalesReps();
    const filteredSalesReps = existingSalesReps.filter(rep => rep.code !== code);
    this.saveLocalSalesReps(filteredSalesReps);
  }

  static clearAllSalesReps(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🗑️ All local sales reps cleared');
  }

  static getSalesRepByCode(code: string): LocalSalesRep | null {
    const salesReps = this.getLocalSalesReps();
    return salesReps.find(rep => rep.code === code && rep.active) || null;
  }

  // Método para salvar dados vindos do Supabase
  static saveFromSupabase(salesRepsData: any[]): void {
    const formattedReps: LocalSalesRep[] = salesRepsData.map(rep => ({
      id: rep.id,
      code: rep.code.toString(),
      name: rep.name,
      email: rep.email,
      phone: rep.phone,
      password: '', // Não armazenar senha localmente
      active: rep.active
    }));
    
    this.saveLocalSalesReps(formattedReps);
    console.log('✅ Sales reps data saved from Supabase');
  }
}
