-- Corrigir schema das funções de criptografia
CREATE OR REPLACE FUNCTION public.hash_password(password text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Usar bcrypt com custo 10 (padrão seguro) - usando schema correto extensions.
  RETURN extensions.crypt(password, extensions.gen_salt('bf', 10));
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
  
  -- Usar crypt para verificar a senha contra o hash bcrypt - usando schema correto extensions.
  RETURN extensions.crypt(password, hash) = hash;
END;
$function$;