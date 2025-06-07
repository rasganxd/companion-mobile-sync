
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
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('❌ Error loading local sales reps:', error);
    }

    // Return real sales rep data for Candatti
    return [
      {
        id: '1',
        code: '1',
        name: 'Candatti',
        email: 'candatti@empresa.com',
        phone: '(11) 99999-9999',
        password: 'senha123',
        active: true
      }
    ];
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
}
