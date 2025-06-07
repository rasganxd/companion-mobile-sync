
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
        // Always ensure Candatti is in the list with real ID
        const hasRealData = savedReps.some((rep: LocalSalesRep) => 
          rep.code === '1' && rep.id === 'e3eff363-2d17-4f73-9918-f53c6bc0bc48'
        );
        if (hasRealData) {
          return savedReps;
        }
      }
    } catch (error) {
      console.error('❌ Error loading local sales reps:', error);
    }

    // Return real sales rep data for Candatti with correct sales_rep_id from database
    const realSalesRepsData = [
      {
        id: 'e3eff363-2d17-4f73-9918-f53c6bc0bc48', // Real ID from database
        code: '1',
        name: 'Candatti',
        email: 'candatti@empresa.com',
        phone: '(11) 99999-9999',
        password: 'senha123',
        active: true
      }
    ];

    // Save for future use
    this.saveLocalSalesReps(realSalesRepsData);
    console.log('✅ Initialized with real Candatti data from database');
    
    return realSalesRepsData;
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

  // Novo método para garantir dados reais sempre disponíveis
  static ensureRealDataAvailable(): void {
    const existingReps = this.getLocalSalesReps();
    const candattiExists = existingReps.some(rep => 
      rep.code === '1' && rep.id === 'e3eff363-2d17-4f73-9918-f53c6bc0bc48'
    );
    
    if (!candattiExists) {
      console.log('🔄 Ensuring Candatti real data is available...');
      this.getLocalSalesReps(); // This will initialize with real data
    }
  }
}
