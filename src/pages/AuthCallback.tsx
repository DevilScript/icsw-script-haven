import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { toast } from '../hooks/use-toast';
import { Button } from '@/components/ui/button';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          toast({
            title: 'ข้อผิดพลาด',
            description: 'ไม่สามารถดึงข้อมูลเซสชันได้ กรุณาลองใหม่',
            variant: 'destructive',
          });
          navigate('/auth');
          return;
        }

        if (data.session) {
          const user = data.session.user;
          const userMetadata = user?.user_metadata || {};
          const discordGlobalName = userMetadata.global_name || userMetadata.username || 'Unknown';
          const username = user.email || user.id; // ใช้ email หรือ id เป็น username
          console.log('User metadata:', userMetadata); // Debug log

          // อัปเดตหรือเพิ่มข้อมูลในตาราง user_id
          const { error: upsertError } = await supabase
            .from('user_id')
            .upsert(
              {
                id: user.id,
                username: username,
                nickname: discordGlobalName,
                created_at: new Date().toISOString(),
              },
              {
                onConflict: 'id', // อัปเดตถ้ามี id อยู่แล้ว
              }
            );

          if (upsertError) {
            console.error('Error upserting user_id:', upsertError);
            toast({
              title: 'ข้อผิดพลาด',
              description: 'ไม่สามารถบันทึกข้อมูลผู้ใช้ได้ กรุณาติดต่อฝ่ายสนับสนุน',
              variant: 'destructive',
            });
            navigate('/auth');
            return;
          }

          toast({
            title: 'สำเร็จ',
            description: `ยินดีต้อนรับ ${discordGlobalName}!`,
          });
          navigate('/'); // ไปที่หน้าแรก
        } else {
          toast({
            title: 'ข้อผิดพลาด',
            description: 'ไม่พบเซสชันผู้ใช้ กรุณาลองใหม่',
            variant: 'destructive',
          });
          navigate('/auth');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        toast({
          title: 'ข้อผิดพลาด',
          description: 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่',
          variant: 'destructive',
        });
        navigate('/auth');
      }
    }

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold">กำลังดำเนินการ...</h1>
        <p>กรุณารอสักครู่ขณะที่เราตรวจสอบข้อมูลของคุณ</p>
        <Button disabled>กำลังโหลด...</Button>
      </div>
    </div>
  );
}