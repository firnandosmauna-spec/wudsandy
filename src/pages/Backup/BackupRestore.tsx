import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Database, Download, Upload, AlertTriangle, Loader2, CheckCircle2, History } from 'lucide-react';
import { toast } from 'sonner';

export default function BackupRestore() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const tablesToBackup = ['categories', 'products', 'customers', 'transactions', 'transaction_items', 'branches'];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const backupData: any = {};
      
      for (const table of tablesToBackup) {
        const { data, error } = await (supabase.from(table as any) as any).select('*');
        if (error) throw error;
        backupData[table] = data;
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_wudsandy_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Backup berhasil diunduh');
    } catch (error: any) {
      toast.error('Gagal melakukan backup', { description: error.message });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('PERINGATAN: Mengimpor data dapat menyebabkan duplikasi jika data sudah ada. Apakah Anda yakin ingin melanjutkan?')) {
        return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      for (const table of tablesToBackup) {
        if (backupData[table] && backupData[table].length > 0) {
          const { error } = await (supabase.from(table as any) as any).upsert(backupData[table]);
          if (error) throw error;
        }
      }

      toast.success('Data berhasil dipulihkan (Restore)');
      window.location.reload(); // Refresh to update all data
    } catch (error: any) {
      toast.error('Gagal memulihkan data', { description: error.message });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Manajemen Data</h1>
        <p className="text-muted-foreground mt-1">Ekspor dan impor data untuk keperluan cadangan atau migrasi.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Export Card */}
        <Card className="border-border bg-card/50 overflow-hidden rounded-3xl shadow-sm">
          <CardHeader className="bg-primary/5 pb-8">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Ekspor Data (Backup)</CardTitle>
            <CardDescription>Unduh seluruh data aplikasi ke dalam file JSON untuk penyimpanan aman.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="space-y-3 mb-8">
               {tablesToBackup.map(t => (
                 <li key={t} className="flex items-center gap-2 text-sm text-foreground/80 lowercase">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t}
                 </li>
               ))}
            </ul>
            <Button 
                onClick={handleExport} 
                className="w-full gradient-primary font-bold h-12 rounded-xl"
                disabled={isExporting}
            >
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Unduh Backup Sekarang
            </Button>
          </CardContent>
        </Card>

        {/* Import Card */}
        <Card className="border-border bg-card/50 overflow-hidden rounded-3xl shadow-sm">
          <CardHeader className="bg-amber-500/5 pb-8">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
              <Upload className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle>Impor Data (Restore)</CardTitle>
            <CardDescription>Unggah file backup sebelumnya untuk memulihkan data ke sistem.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
               <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-900 font-medium leading-relaxed">
                    Hati-hati! Fitur ini akan menggabungkan atau memperbarui data yang sudah ada. Pastikan format file sesuai dengan hasil ekspor sistem ini.
                  </p>
               </div>
            </div>

            <div className="relative">
                <input 
                    type="file" 
                    accept=".json" 
                    onChange={handleImport}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    disabled={isImporting}
                />
                <Button 
                    variant="outline" 
                    className="w-full h-12 border-dashed border-2 rounded-xl border-border bg-background hover:bg-muted"
                    disabled={isImporting}
                >
                   {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                   Pilih File Backup (.json)
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Log Placeholder */}
      <Card className="border-border bg-card/30 rounded-3xl">
         <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" /> Log Aktivitas
            </CardTitle>
         </CardHeader>
         <CardContent>
             <p className="text-sm text-muted-foreground text-center py-4 italic">Belum ada riwayat aktivitas terbaru.</p>
         </CardContent>
      </Card>
    </div>
  );
}
