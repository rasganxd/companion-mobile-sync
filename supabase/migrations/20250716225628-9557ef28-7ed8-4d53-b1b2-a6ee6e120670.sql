-- Corrigir função hash_password
CREATE OR REPLACE FUNCTION public.hash_password(password text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Usar bcrypt com custo 10 (padrão seguro) - removendo prefixo public.
  RETURN crypt(password, gen_salt('bf', 10));
END;
$function$;

-- Corrigir função verify_password
CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Verificar se o hash fornecido é válido
  IF hash IS NULL OR hash = '' THEN
    RETURN false;
  END IF;
  
  -- Usar crypt para verificar a senha contra o hash bcrypt - removendo prefixo public.
  RETURN crypt(password, hash) = hash;
END;
$function$;