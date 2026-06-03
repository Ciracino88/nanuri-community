import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export interface UserProfile {
  name: string;
  account_number: string;
  bank_name: string;
}

export function useBillForm() {
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserHistory();
  }, []);

  const checkUserHistory = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    setLoading(false);
    return;
  }

  // 익명 유저면 바로 신규 처리
  if (user.is_anonymous) {
    setIsNewUser(true);
    setLoading(false);
    return;
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile) {
    setIsNewUser(false);
    setUserProfile(profile);
  } else {
    setIsNewUser(true);
  }

  setLoading(false);
};

  return { isNewUser, userProfile, loading };
}