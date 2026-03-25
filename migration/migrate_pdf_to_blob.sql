-- migration : stocker les pdf dans la base de données
-- date : 2025-12-16

use `sntp_db`;

-- étape 1 : ajouter les nouvelles colonnes pour stocker le pdf
alter table `appels_offres`
add column `pdf_data` longblob comment 'contenu binaire du fichier pdf',
add column `pdf_size` int comment 'taille du fichier en octets',
add column `pdf_mime_type` varchar(100) default 'application/pdf' comment 'type mime du fichier';

-- étape 2 : les anciennes colonnes pdf_path et pdf_original_name restent pour compatibilité
-- elles seront utilisées temporairement pendant la transition

-- étape 3 : vérification
select 
    column_name, 
    data_type, 
    character_maximum_length,
    column_comment
from information_schema.columns
where table_schema = 'sntp_db' 
  and table_name = 'appels_offres'
  and column_name in ('pdf_data', 'pdf_size', 'pdf_mime_type', 'pdf_path', 'pdf_original_name');

