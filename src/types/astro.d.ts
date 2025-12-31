declare namespace App {
  interface Locals {
    session?: import('@supabase/supabase-js').Session;
    user?: import('@supabase/supabase-js').User;
  }
}
