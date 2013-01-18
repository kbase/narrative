/**
 * The KBase API
 * http://kbase.us
 *
 * API documentation: http://kbase.us/developer-zone/api-documentation/
 * @license Copyright (c) 2013, The DOE Systems Biology Knowledgebase Project
 */
 

function CDMI_API(url) {

    var _url = url;


    this.fids_to_annotations = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_annotations", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_annotations", [fids]);
        return resp[0];
    }

    this.fids_to_annotations_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_annotations", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_functions = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_functions", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_functions", [fids]);
        return resp[0];
    }

    this.fids_to_functions_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_functions", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_literature = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_literature", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_literature", [fids]);
        return resp[0];
    }

    this.fids_to_literature_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_literature", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_protein_families = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_protein_families", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_protein_families", [fids]);
        return resp[0];
    }

    this.fids_to_protein_families_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_protein_families", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_roles = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_roles", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_roles", [fids]);
        return resp[0];
    }

    this.fids_to_roles_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_roles", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_subsystems = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_subsystems", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_subsystems", [fids]);
        return resp[0];
    }

    this.fids_to_subsystems_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_subsystems", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_co_occurring_fids = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_co_occurring_fids", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_co_occurring_fids", [fids]);
        return resp[0];
    }

    this.fids_to_co_occurring_fids_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_co_occurring_fids", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_locations = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_locations", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_locations", [fids]);
        return resp[0];
    }

    this.fids_to_locations_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_locations", [fids], 1, _callback, _error_callback)
    }

    this.locations_to_fids = function(region_of_dna_strings)
    {
	var resp = json_call_ajax_sync("CDMI_API.locations_to_fids", [region_of_dna_strings]);
//	var resp = json_call_sync("CDMI_API.locations_to_fids", [region_of_dna_strings]);
        return resp[0];
    }

    this.locations_to_fids_async = function(region_of_dna_strings, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.locations_to_fids", [region_of_dna_strings], 1, _callback, _error_callback)
    }

    this.alleles_to_bp_locs = function(alleles)
    {
	var resp = json_call_ajax_sync("CDMI_API.alleles_to_bp_locs", [alleles]);
//	var resp = json_call_sync("CDMI_API.alleles_to_bp_locs", [alleles]);
        return resp[0];
    }

    this.alleles_to_bp_locs_async = function(alleles, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.alleles_to_bp_locs", [alleles], 1, _callback, _error_callback)
    }

    this.region_to_fids = function(region_of_dna)
    {
	var resp = json_call_ajax_sync("CDMI_API.region_to_fids", [region_of_dna]);
//	var resp = json_call_sync("CDMI_API.region_to_fids", [region_of_dna]);
        return resp[0];
    }

    this.region_to_fids_async = function(region_of_dna, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.region_to_fids", [region_of_dna], 1, _callback, _error_callback)
    }

    this.region_to_alleles = function(region_of_dna)
    {
	var resp = json_call_ajax_sync("CDMI_API.region_to_alleles", [region_of_dna]);
//	var resp = json_call_sync("CDMI_API.region_to_alleles", [region_of_dna]);
        return resp[0];
    }

    this.region_to_alleles_async = function(region_of_dna, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.region_to_alleles", [region_of_dna], 1, _callback, _error_callback)
    }

    this.alleles_to_traits = function(alleles)
    {
	var resp = json_call_ajax_sync("CDMI_API.alleles_to_traits", [alleles]);
//	var resp = json_call_sync("CDMI_API.alleles_to_traits", [alleles]);
        return resp[0];
    }

    this.alleles_to_traits_async = function(alleles, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.alleles_to_traits", [alleles], 1, _callback, _error_callback)
    }

    this.traits_to_alleles = function(traits)
    {
	var resp = json_call_ajax_sync("CDMI_API.traits_to_alleles", [traits]);
//	var resp = json_call_sync("CDMI_API.traits_to_alleles", [traits]);
        return resp[0];
    }

    this.traits_to_alleles_async = function(traits, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.traits_to_alleles", [traits], 1, _callback, _error_callback)
    }

    this.ous_with_trait = function(genome, trait, measurement_type, min_value, max_value)
    {
	var resp = json_call_ajax_sync("CDMI_API.ous_with_trait", [genome, trait, measurement_type, min_value, max_value]);
//	var resp = json_call_sync("CDMI_API.ous_with_trait", [genome, trait, measurement_type, min_value, max_value]);
        return resp[0];
    }

    this.ous_with_trait_async = function(genome, trait, measurement_type, min_value, max_value, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.ous_with_trait", [genome, trait, measurement_type, min_value, max_value], 1, _callback, _error_callback)
    }

    this.locations_to_dna_sequences = function(locations)
    {
	var resp = json_call_ajax_sync("CDMI_API.locations_to_dna_sequences", [locations]);
//	var resp = json_call_sync("CDMI_API.locations_to_dna_sequences", [locations]);
        return resp[0];
    }

    this.locations_to_dna_sequences_async = function(locations, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.locations_to_dna_sequences", [locations], 1, _callback, _error_callback)
    }

    this.proteins_to_fids = function(proteins)
    {
	var resp = json_call_ajax_sync("CDMI_API.proteins_to_fids", [proteins]);
//	var resp = json_call_sync("CDMI_API.proteins_to_fids", [proteins]);
        return resp[0];
    }

    this.proteins_to_fids_async = function(proteins, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.proteins_to_fids", [proteins], 1, _callback, _error_callback)
    }

    this.proteins_to_protein_families = function(proteins)
    {
	var resp = json_call_ajax_sync("CDMI_API.proteins_to_protein_families", [proteins]);
//	var resp = json_call_sync("CDMI_API.proteins_to_protein_families", [proteins]);
        return resp[0];
    }

    this.proteins_to_protein_families_async = function(proteins, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.proteins_to_protein_families", [proteins], 1, _callback, _error_callback)
    }

    this.proteins_to_literature = function(proteins)
    {
	var resp = json_call_ajax_sync("CDMI_API.proteins_to_literature", [proteins]);
//	var resp = json_call_sync("CDMI_API.proteins_to_literature", [proteins]);
        return resp[0];
    }

    this.proteins_to_literature_async = function(proteins, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.proteins_to_literature", [proteins], 1, _callback, _error_callback)
    }

    this.proteins_to_functions = function(proteins)
    {
	var resp = json_call_ajax_sync("CDMI_API.proteins_to_functions", [proteins]);
//	var resp = json_call_sync("CDMI_API.proteins_to_functions", [proteins]);
        return resp[0];
    }

    this.proteins_to_functions_async = function(proteins, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.proteins_to_functions", [proteins], 1, _callback, _error_callback)
    }

    this.proteins_to_roles = function(proteins)
    {
	var resp = json_call_ajax_sync("CDMI_API.proteins_to_roles", [proteins]);
//	var resp = json_call_sync("CDMI_API.proteins_to_roles", [proteins]);
        return resp[0];
    }

    this.proteins_to_roles_async = function(proteins, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.proteins_to_roles", [proteins], 1, _callback, _error_callback)
    }

    this.roles_to_proteins = function(roles)
    {
	var resp = json_call_ajax_sync("CDMI_API.roles_to_proteins", [roles]);
//	var resp = json_call_sync("CDMI_API.roles_to_proteins", [roles]);
        return resp[0];
    }

    this.roles_to_proteins_async = function(roles, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.roles_to_proteins", [roles], 1, _callback, _error_callback)
    }

    this.roles_to_subsystems = function(roles)
    {
	var resp = json_call_ajax_sync("CDMI_API.roles_to_subsystems", [roles]);
//	var resp = json_call_sync("CDMI_API.roles_to_subsystems", [roles]);
        return resp[0];
    }

    this.roles_to_subsystems_async = function(roles, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.roles_to_subsystems", [roles], 1, _callback, _error_callback)
    }

    this.roles_to_protein_families = function(roles)
    {
	var resp = json_call_ajax_sync("CDMI_API.roles_to_protein_families", [roles]);
//	var resp = json_call_sync("CDMI_API.roles_to_protein_families", [roles]);
        return resp[0];
    }

    this.roles_to_protein_families_async = function(roles, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.roles_to_protein_families", [roles], 1, _callback, _error_callback)
    }

    this.fids_to_coexpressed_fids = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_coexpressed_fids", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_coexpressed_fids", [fids]);
        return resp[0];
    }

    this.fids_to_coexpressed_fids_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_coexpressed_fids", [fids], 1, _callback, _error_callback)
    }

    this.protein_families_to_fids = function(protein_families)
    {
	var resp = json_call_ajax_sync("CDMI_API.protein_families_to_fids", [protein_families]);
//	var resp = json_call_sync("CDMI_API.protein_families_to_fids", [protein_families]);
        return resp[0];
    }

    this.protein_families_to_fids_async = function(protein_families, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.protein_families_to_fids", [protein_families], 1, _callback, _error_callback)
    }

    this.protein_families_to_proteins = function(protein_families)
    {
	var resp = json_call_ajax_sync("CDMI_API.protein_families_to_proteins", [protein_families]);
//	var resp = json_call_sync("CDMI_API.protein_families_to_proteins", [protein_families]);
        return resp[0];
    }

    this.protein_families_to_proteins_async = function(protein_families, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.protein_families_to_proteins", [protein_families], 1, _callback, _error_callback)
    }

    this.protein_families_to_functions = function(protein_families)
    {
	var resp = json_call_ajax_sync("CDMI_API.protein_families_to_functions", [protein_families]);
//	var resp = json_call_sync("CDMI_API.protein_families_to_functions", [protein_families]);
        return resp[0];
    }

    this.protein_families_to_functions_async = function(protein_families, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.protein_families_to_functions", [protein_families], 1, _callback, _error_callback)
    }

    this.protein_families_to_co_occurring_families = function(protein_families)
    {
	var resp = json_call_ajax_sync("CDMI_API.protein_families_to_co_occurring_families", [protein_families]);
//	var resp = json_call_sync("CDMI_API.protein_families_to_co_occurring_families", [protein_families]);
        return resp[0];
    }

    this.protein_families_to_co_occurring_families_async = function(protein_families, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.protein_families_to_co_occurring_families", [protein_families], 1, _callback, _error_callback)
    }

    this.co_occurrence_evidence = function(pairs_of_fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.co_occurrence_evidence", [pairs_of_fids]);
//	var resp = json_call_sync("CDMI_API.co_occurrence_evidence", [pairs_of_fids]);
        return resp[0];
    }

    this.co_occurrence_evidence_async = function(pairs_of_fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.co_occurrence_evidence", [pairs_of_fids], 1, _callback, _error_callback)
    }

    this.contigs_to_sequences = function(contigs)
    {
	var resp = json_call_ajax_sync("CDMI_API.contigs_to_sequences", [contigs]);
//	var resp = json_call_sync("CDMI_API.contigs_to_sequences", [contigs]);
        return resp[0];
    }

    this.contigs_to_sequences_async = function(contigs, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.contigs_to_sequences", [contigs], 1, _callback, _error_callback)
    }

    this.contigs_to_lengths = function(contigs)
    {
	var resp = json_call_ajax_sync("CDMI_API.contigs_to_lengths", [contigs]);
//	var resp = json_call_sync("CDMI_API.contigs_to_lengths", [contigs]);
        return resp[0];
    }

    this.contigs_to_lengths_async = function(contigs, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.contigs_to_lengths", [contigs], 1, _callback, _error_callback)
    }

    this.contigs_to_md5s = function(contigs)
    {
	var resp = json_call_ajax_sync("CDMI_API.contigs_to_md5s", [contigs]);
//	var resp = json_call_sync("CDMI_API.contigs_to_md5s", [contigs]);
        return resp[0];
    }

    this.contigs_to_md5s_async = function(contigs, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.contigs_to_md5s", [contigs], 1, _callback, _error_callback)
    }

    this.md5s_to_genomes = function(md5s)
    {
	var resp = json_call_ajax_sync("CDMI_API.md5s_to_genomes", [md5s]);
//	var resp = json_call_sync("CDMI_API.md5s_to_genomes", [md5s]);
        return resp[0];
    }

    this.md5s_to_genomes_async = function(md5s, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.md5s_to_genomes", [md5s], 1, _callback, _error_callback)
    }

    this.genomes_to_md5s = function(genomes)
    {
	var resp = json_call_ajax_sync("CDMI_API.genomes_to_md5s", [genomes]);
//	var resp = json_call_sync("CDMI_API.genomes_to_md5s", [genomes]);
        return resp[0];
    }

    this.genomes_to_md5s_async = function(genomes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.genomes_to_md5s", [genomes], 1, _callback, _error_callback)
    }

    this.genomes_to_contigs = function(genomes)
    {
	var resp = json_call_ajax_sync("CDMI_API.genomes_to_contigs", [genomes]);
//	var resp = json_call_sync("CDMI_API.genomes_to_contigs", [genomes]);
        return resp[0];
    }

    this.genomes_to_contigs_async = function(genomes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.genomes_to_contigs", [genomes], 1, _callback, _error_callback)
    }

    this.genomes_to_fids = function(genomes, types_of_fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.genomes_to_fids", [genomes, types_of_fids]);
//	var resp = json_call_sync("CDMI_API.genomes_to_fids", [genomes, types_of_fids]);
        return resp[0];
    }

    this.genomes_to_fids_async = function(genomes, types_of_fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.genomes_to_fids", [genomes, types_of_fids], 1, _callback, _error_callback)
    }

    this.genomes_to_taxonomies = function(genomes)
    {
	var resp = json_call_ajax_sync("CDMI_API.genomes_to_taxonomies", [genomes]);
//	var resp = json_call_sync("CDMI_API.genomes_to_taxonomies", [genomes]);
        return resp[0];
    }

    this.genomes_to_taxonomies_async = function(genomes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.genomes_to_taxonomies", [genomes], 1, _callback, _error_callback)
    }

    this.genomes_to_subsystems = function(genomes)
    {
	var resp = json_call_ajax_sync("CDMI_API.genomes_to_subsystems", [genomes]);
//	var resp = json_call_sync("CDMI_API.genomes_to_subsystems", [genomes]);
        return resp[0];
    }

    this.genomes_to_subsystems_async = function(genomes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.genomes_to_subsystems", [genomes], 1, _callback, _error_callback)
    }

    this.subsystems_to_genomes = function(subsystems)
    {
	var resp = json_call_ajax_sync("CDMI_API.subsystems_to_genomes", [subsystems]);
//	var resp = json_call_sync("CDMI_API.subsystems_to_genomes", [subsystems]);
        return resp[0];
    }

    this.subsystems_to_genomes_async = function(subsystems, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.subsystems_to_genomes", [subsystems], 1, _callback, _error_callback)
    }

    this.subsystems_to_fids = function(subsystems, genomes)
    {
	var resp = json_call_ajax_sync("CDMI_API.subsystems_to_fids", [subsystems, genomes]);
//	var resp = json_call_sync("CDMI_API.subsystems_to_fids", [subsystems, genomes]);
        return resp[0];
    }

    this.subsystems_to_fids_async = function(subsystems, genomes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.subsystems_to_fids", [subsystems, genomes], 1, _callback, _error_callback)
    }

    this.subsystems_to_roles = function(subsystems, aux)
    {
	var resp = json_call_ajax_sync("CDMI_API.subsystems_to_roles", [subsystems, aux]);
//	var resp = json_call_sync("CDMI_API.subsystems_to_roles", [subsystems, aux]);
        return resp[0];
    }

    this.subsystems_to_roles_async = function(subsystems, aux, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.subsystems_to_roles", [subsystems, aux], 1, _callback, _error_callback)
    }

    this.subsystems_to_spreadsheets = function(subsystems, genomes)
    {
	var resp = json_call_ajax_sync("CDMI_API.subsystems_to_spreadsheets", [subsystems, genomes]);
//	var resp = json_call_sync("CDMI_API.subsystems_to_spreadsheets", [subsystems, genomes]);
        return resp[0];
    }

    this.subsystems_to_spreadsheets_async = function(subsystems, genomes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.subsystems_to_spreadsheets", [subsystems, genomes], 1, _callback, _error_callback)
    }

    this.all_roles_used_in_models = function()
    {
	var resp = json_call_ajax_sync("CDMI_API.all_roles_used_in_models", []);
//	var resp = json_call_sync("CDMI_API.all_roles_used_in_models", []);
        return resp[0];
    }

    this.all_roles_used_in_models_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.all_roles_used_in_models", [], 1, _callback, _error_callback)
    }

    this.complexes_to_complex_data = function(complexes)
    {
	var resp = json_call_ajax_sync("CDMI_API.complexes_to_complex_data", [complexes]);
//	var resp = json_call_sync("CDMI_API.complexes_to_complex_data", [complexes]);
        return resp[0];
    }

    this.complexes_to_complex_data_async = function(complexes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.complexes_to_complex_data", [complexes], 1, _callback, _error_callback)
    }

    this.genomes_to_genome_data = function(genomes)
    {
	var resp = json_call_ajax_sync("CDMI_API.genomes_to_genome_data", [genomes]);
//	var resp = json_call_sync("CDMI_API.genomes_to_genome_data", [genomes]);
        return resp[0];
    }

    this.genomes_to_genome_data_async = function(genomes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.genomes_to_genome_data", [genomes], 1, _callback, _error_callback)
    }

    this.fids_to_regulon_data = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_regulon_data", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_regulon_data", [fids]);
        return resp[0];
    }

    this.fids_to_regulon_data_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_regulon_data", [fids], 1, _callback, _error_callback)
    }

    this.regulons_to_fids = function(regulons)
    {
	var resp = json_call_ajax_sync("CDMI_API.regulons_to_fids", [regulons]);
//	var resp = json_call_sync("CDMI_API.regulons_to_fids", [regulons]);
        return resp[0];
    }

    this.regulons_to_fids_async = function(regulons, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.regulons_to_fids", [regulons], 1, _callback, _error_callback)
    }

    this.fids_to_feature_data = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_feature_data", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_feature_data", [fids]);
        return resp[0];
    }

    this.fids_to_feature_data_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_feature_data", [fids], 1, _callback, _error_callback)
    }

    this.equiv_sequence_assertions = function(proteins)
    {
	var resp = json_call_ajax_sync("CDMI_API.equiv_sequence_assertions", [proteins]);
//	var resp = json_call_sync("CDMI_API.equiv_sequence_assertions", [proteins]);
        return resp[0];
    }

    this.equiv_sequence_assertions_async = function(proteins, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.equiv_sequence_assertions", [proteins], 1, _callback, _error_callback)
    }

    this.fids_to_atomic_regulons = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_atomic_regulons", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_atomic_regulons", [fids]);
        return resp[0];
    }

    this.fids_to_atomic_regulons_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_atomic_regulons", [fids], 1, _callback, _error_callback)
    }

    this.atomic_regulons_to_fids = function(atomic_regulons)
    {
	var resp = json_call_ajax_sync("CDMI_API.atomic_regulons_to_fids", [atomic_regulons]);
//	var resp = json_call_sync("CDMI_API.atomic_regulons_to_fids", [atomic_regulons]);
        return resp[0];
    }

    this.atomic_regulons_to_fids_async = function(atomic_regulons, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.atomic_regulons_to_fids", [atomic_regulons], 1, _callback, _error_callback)
    }

    this.fids_to_protein_sequences = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_protein_sequences", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_protein_sequences", [fids]);
        return resp[0];
    }

    this.fids_to_protein_sequences_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_protein_sequences", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_proteins = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_proteins", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_proteins", [fids]);
        return resp[0];
    }

    this.fids_to_proteins_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_proteins", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_dna_sequences = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_dna_sequences", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_dna_sequences", [fids]);
        return resp[0];
    }

    this.fids_to_dna_sequences_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_dna_sequences", [fids], 1, _callback, _error_callback)
    }

    this.roles_to_fids = function(roles, genomes)
    {
	var resp = json_call_ajax_sync("CDMI_API.roles_to_fids", [roles, genomes]);
//	var resp = json_call_sync("CDMI_API.roles_to_fids", [roles, genomes]);
        return resp[0];
    }

    this.roles_to_fids_async = function(roles, genomes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.roles_to_fids", [roles, genomes], 1, _callback, _error_callback)
    }

    this.reactions_to_complexes = function(reactions)
    {
	var resp = json_call_ajax_sync("CDMI_API.reactions_to_complexes", [reactions]);
//	var resp = json_call_sync("CDMI_API.reactions_to_complexes", [reactions]);
        return resp[0];
    }

    this.reactions_to_complexes_async = function(reactions, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.reactions_to_complexes", [reactions], 1, _callback, _error_callback)
    }

    this.aliases_to_fids = function(aliases)
    {
	var resp = json_call_ajax_sync("CDMI_API.aliases_to_fids", [aliases]);
//	var resp = json_call_sync("CDMI_API.aliases_to_fids", [aliases]);
        return resp[0];
    }

    this.aliases_to_fids_async = function(aliases, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.aliases_to_fids", [aliases], 1, _callback, _error_callback)
    }

    this.external_ids_to_fids = function(external_ids, prefix_match)
    {
	var resp = json_call_ajax_sync("CDMI_API.external_ids_to_fids", [external_ids, prefix_match]);
//	var resp = json_call_sync("CDMI_API.external_ids_to_fids", [external_ids, prefix_match]);
        return resp[0];
    }

    this.external_ids_to_fids_async = function(external_ids, prefix_match, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.external_ids_to_fids", [external_ids, prefix_match], 1, _callback, _error_callback)
    }

    this.reaction_strings = function(reactions, name_parameter)
    {
	var resp = json_call_ajax_sync("CDMI_API.reaction_strings", [reactions, name_parameter]);
//	var resp = json_call_sync("CDMI_API.reaction_strings", [reactions, name_parameter]);
        return resp[0];
    }

    this.reaction_strings_async = function(reactions, name_parameter, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.reaction_strings", [reactions, name_parameter], 1, _callback, _error_callback)
    }

    this.roles_to_complexes = function(roles)
    {
	var resp = json_call_ajax_sync("CDMI_API.roles_to_complexes", [roles]);
//	var resp = json_call_sync("CDMI_API.roles_to_complexes", [roles]);
        return resp[0];
    }

    this.roles_to_complexes_async = function(roles, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.roles_to_complexes", [roles], 1, _callback, _error_callback)
    }

    this.complexes_to_roles = function(complexes)
    {
	var resp = json_call_ajax_sync("CDMI_API.complexes_to_roles", [complexes]);
//	var resp = json_call_sync("CDMI_API.complexes_to_roles", [complexes]);
        return resp[0];
    }

    this.complexes_to_roles_async = function(complexes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.complexes_to_roles", [complexes], 1, _callback, _error_callback)
    }

    this.fids_to_subsystem_data = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_subsystem_data", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_subsystem_data", [fids]);
        return resp[0];
    }

    this.fids_to_subsystem_data_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_subsystem_data", [fids], 1, _callback, _error_callback)
    }

    this.representative = function(genomes)
    {
	var resp = json_call_ajax_sync("CDMI_API.representative", [genomes]);
//	var resp = json_call_sync("CDMI_API.representative", [genomes]);
        return resp[0];
    }

    this.representative_async = function(genomes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.representative", [genomes], 1, _callback, _error_callback)
    }

    this.otu_members = function(genomes)
    {
	var resp = json_call_ajax_sync("CDMI_API.otu_members", [genomes]);
//	var resp = json_call_sync("CDMI_API.otu_members", [genomes]);
        return resp[0];
    }

    this.otu_members_async = function(genomes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.otu_members", [genomes], 1, _callback, _error_callback)
    }

    this.otus_to_representatives = function(otus)
    {
	var resp = json_call_ajax_sync("CDMI_API.otus_to_representatives", [otus]);
//	var resp = json_call_sync("CDMI_API.otus_to_representatives", [otus]);
        return resp[0];
    }

    this.otus_to_representatives_async = function(otus, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.otus_to_representatives", [otus], 1, _callback, _error_callback)
    }

    this.fids_to_genomes = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_genomes", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_genomes", [fids]);
        return resp[0];
    }

    this.fids_to_genomes_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_genomes", [fids], 1, _callback, _error_callback)
    }

    this.text_search = function(input, start, count, entities)
    {
	var resp = json_call_ajax_sync("CDMI_API.text_search", [input, start, count, entities]);
//	var resp = json_call_sync("CDMI_API.text_search", [input, start, count, entities]);
        return resp[0];
    }

    this.text_search_async = function(input, start, count, entities, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.text_search", [input, start, count, entities], 1, _callback, _error_callback)
    }

    this.corresponds = function(fids, genome)
    {
	var resp = json_call_ajax_sync("CDMI_API.corresponds", [fids, genome]);
//	var resp = json_call_sync("CDMI_API.corresponds", [fids, genome]);
        return resp[0];
    }

    this.corresponds_async = function(fids, genome, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.corresponds", [fids, genome], 1, _callback, _error_callback)
    }

    this.corresponds_from_sequences = function(g1_sequences, g1_locations, g2_sequences, g2_locations)
    {
	var resp = json_call_ajax_sync("CDMI_API.corresponds_from_sequences", [g1_sequences, g1_locations, g2_sequences, g2_locations]);
//	var resp = json_call_sync("CDMI_API.corresponds_from_sequences", [g1_sequences, g1_locations, g2_sequences, g2_locations]);
        return resp[0];
    }

    this.corresponds_from_sequences_async = function(g1_sequences, g1_locations, g2_sequences, g2_locations, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.corresponds_from_sequences", [g1_sequences, g1_locations, g2_sequences, g2_locations], 1, _callback, _error_callback)
    }

    this.close_genomes = function(seq_set, n)
    {
	var resp = json_call_ajax_sync("CDMI_API.close_genomes", [seq_set, n]);
//	var resp = json_call_sync("CDMI_API.close_genomes", [seq_set, n]);
        return resp[0];
    }

    this.close_genomes_async = function(seq_set, n, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.close_genomes", [seq_set, n], 1, _callback, _error_callback)
    }

    this.representative_sequences = function(seq_set, rep_seq_parms)
    {
	var resp = json_call_ajax_sync("CDMI_API.representative_sequences", [seq_set, rep_seq_parms]);
//	var resp = json_call_sync("CDMI_API.representative_sequences", [seq_set, rep_seq_parms]);
        return resp;
    }

    this.representative_sequences_async = function(seq_set, rep_seq_parms, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.representative_sequences", [seq_set, rep_seq_parms], 2, _callback, _error_callback)
    }

    this.align_sequences = function(seq_set, align_seq_parms)
    {
	var resp = json_call_ajax_sync("CDMI_API.align_sequences", [seq_set, align_seq_parms]);
//	var resp = json_call_sync("CDMI_API.align_sequences", [seq_set, align_seq_parms]);
        return resp[0];
    }

    this.align_sequences_async = function(seq_set, align_seq_parms, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.align_sequences", [seq_set, align_seq_parms], 1, _callback, _error_callback)
    }

    this.build_tree = function(alignment, build_tree_parms)
    {
	var resp = json_call_ajax_sync("CDMI_API.build_tree", [alignment, build_tree_parms]);
//	var resp = json_call_sync("CDMI_API.build_tree", [alignment, build_tree_parms]);
        return resp[0];
    }

    this.build_tree_async = function(alignment, build_tree_parms, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.build_tree", [alignment, build_tree_parms], 1, _callback, _error_callback)
    }

    this.alignment_by_id = function(aln_id)
    {
	var resp = json_call_ajax_sync("CDMI_API.alignment_by_id", [aln_id]);
//	var resp = json_call_sync("CDMI_API.alignment_by_id", [aln_id]);
        return resp[0];
    }

    this.alignment_by_id_async = function(aln_id, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.alignment_by_id", [aln_id], 1, _callback, _error_callback)
    }

    this.tree_by_id = function(tree_id)
    {
	var resp = json_call_ajax_sync("CDMI_API.tree_by_id", [tree_id]);
//	var resp = json_call_sync("CDMI_API.tree_by_id", [tree_id]);
        return resp[0];
    }

    this.tree_by_id_async = function(tree_id, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.tree_by_id", [tree_id], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function CDMI_EntityAPI(url) {

    var _url = url;


    this.get_entity_Alignment = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Alignment", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Alignment", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Alignment_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Alignment", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Alignment = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Alignment", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Alignment", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Alignment_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Alignment", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Alignment = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Alignment", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Alignment", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Alignment_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Alignment", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_AlignmentAttribute = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_AlignmentAttribute", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_AlignmentAttribute", [ids, fields]);
        return resp[0];
    }

    this.get_entity_AlignmentAttribute_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_AlignmentAttribute", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_AlignmentAttribute = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_AlignmentAttribute", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_AlignmentAttribute", [qry, fields]);
        return resp[0];
    }

    this.query_entity_AlignmentAttribute_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_AlignmentAttribute", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_AlignmentAttribute = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_AlignmentAttribute", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_AlignmentAttribute", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_AlignmentAttribute_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_AlignmentAttribute", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_AlignmentRow = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_AlignmentRow", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_AlignmentRow", [ids, fields]);
        return resp[0];
    }

    this.get_entity_AlignmentRow_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_AlignmentRow", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_AlignmentRow = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_AlignmentRow", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_AlignmentRow", [qry, fields]);
        return resp[0];
    }

    this.query_entity_AlignmentRow_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_AlignmentRow", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_AlignmentRow = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_AlignmentRow", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_AlignmentRow", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_AlignmentRow_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_AlignmentRow", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_AlleleFrequency = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_AlleleFrequency", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_AlleleFrequency", [ids, fields]);
        return resp[0];
    }

    this.get_entity_AlleleFrequency_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_AlleleFrequency", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_AlleleFrequency = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_AlleleFrequency", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_AlleleFrequency", [qry, fields]);
        return resp[0];
    }

    this.query_entity_AlleleFrequency_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_AlleleFrequency", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_AlleleFrequency = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_AlleleFrequency", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_AlleleFrequency", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_AlleleFrequency_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_AlleleFrequency", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Annotation = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Annotation", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Annotation", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Annotation_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Annotation", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Annotation = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Annotation", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Annotation", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Annotation_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Annotation", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Annotation = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Annotation", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Annotation", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Annotation_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Annotation", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Assay = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Assay", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Assay", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Assay_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Assay", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Assay = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Assay", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Assay", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Assay_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Assay", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Assay = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Assay", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Assay", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Assay_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Assay", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_AtomicRegulon = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_AtomicRegulon", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_AtomicRegulon", [ids, fields]);
        return resp[0];
    }

    this.get_entity_AtomicRegulon_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_AtomicRegulon", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_AtomicRegulon = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_AtomicRegulon", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_AtomicRegulon", [qry, fields]);
        return resp[0];
    }

    this.query_entity_AtomicRegulon_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_AtomicRegulon", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_AtomicRegulon = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_AtomicRegulon", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_AtomicRegulon", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_AtomicRegulon_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_AtomicRegulon", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Attribute = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Attribute", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Attribute", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Attribute_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Attribute", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Attribute = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Attribute", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Attribute", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Attribute_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Attribute", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Attribute = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Attribute", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Attribute", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Attribute_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Attribute", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Biomass = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Biomass", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Biomass", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Biomass_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Biomass", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Biomass = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Biomass", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Biomass", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Biomass_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Biomass", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Biomass = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Biomass", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Biomass", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Biomass_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Biomass", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_CodonUsage = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_CodonUsage", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_CodonUsage", [ids, fields]);
        return resp[0];
    }

    this.get_entity_CodonUsage_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_CodonUsage", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_CodonUsage = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_CodonUsage", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_CodonUsage", [qry, fields]);
        return resp[0];
    }

    this.query_entity_CodonUsage_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_CodonUsage", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_CodonUsage = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_CodonUsage", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_CodonUsage", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_CodonUsage_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_CodonUsage", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Complex = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Complex", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Complex", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Complex_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Complex", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Complex = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Complex", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Complex", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Complex_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Complex", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Complex = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Complex", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Complex", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Complex_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Complex", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Compound = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Compound", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Compound", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Compound_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Compound", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Compound = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Compound", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Compound", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Compound_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Compound", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Compound = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Compound", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Compound", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Compound_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Compound", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_CompoundInstance = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_CompoundInstance", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_CompoundInstance", [ids, fields]);
        return resp[0];
    }

    this.get_entity_CompoundInstance_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_CompoundInstance", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_CompoundInstance = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_CompoundInstance", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_CompoundInstance", [qry, fields]);
        return resp[0];
    }

    this.query_entity_CompoundInstance_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_CompoundInstance", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_CompoundInstance = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_CompoundInstance", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_CompoundInstance", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_CompoundInstance_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_CompoundInstance", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Contig = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Contig", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Contig", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Contig_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Contig", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Contig = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Contig", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Contig", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Contig_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Contig", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Contig = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Contig", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Contig", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Contig_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Contig", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_ContigChunk = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_ContigChunk", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_ContigChunk", [ids, fields]);
        return resp[0];
    }

    this.get_entity_ContigChunk_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_ContigChunk", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_ContigChunk = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_ContigChunk", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_ContigChunk", [qry, fields]);
        return resp[0];
    }

    this.query_entity_ContigChunk_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_ContigChunk", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_ContigChunk = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_ContigChunk", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_ContigChunk", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_ContigChunk_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_ContigChunk", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_ContigSequence = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_ContigSequence", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_ContigSequence", [ids, fields]);
        return resp[0];
    }

    this.get_entity_ContigSequence_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_ContigSequence", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_ContigSequence = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_ContigSequence", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_ContigSequence", [qry, fields]);
        return resp[0];
    }

    this.query_entity_ContigSequence_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_ContigSequence", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_ContigSequence = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_ContigSequence", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_ContigSequence", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_ContigSequence_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_ContigSequence", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_CoregulatedSet = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_CoregulatedSet", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_CoregulatedSet", [ids, fields]);
        return resp[0];
    }

    this.get_entity_CoregulatedSet_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_CoregulatedSet", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_CoregulatedSet = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_CoregulatedSet", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_CoregulatedSet", [qry, fields]);
        return resp[0];
    }

    this.query_entity_CoregulatedSet_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_CoregulatedSet", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_CoregulatedSet = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_CoregulatedSet", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_CoregulatedSet", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_CoregulatedSet_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_CoregulatedSet", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Diagram = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Diagram", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Diagram", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Diagram_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Diagram", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Diagram = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Diagram", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Diagram", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Diagram_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Diagram", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Diagram = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Diagram", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Diagram", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Diagram_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Diagram", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_EcNumber = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_EcNumber", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_EcNumber", [ids, fields]);
        return resp[0];
    }

    this.get_entity_EcNumber_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_EcNumber", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_EcNumber = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_EcNumber", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_EcNumber", [qry, fields]);
        return resp[0];
    }

    this.query_entity_EcNumber_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_EcNumber", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_EcNumber = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_EcNumber", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_EcNumber", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_EcNumber_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_EcNumber", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Environment = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Environment", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Environment", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Environment_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Environment", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Environment = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Environment", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Environment", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Environment_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Environment", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Environment = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Environment", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Environment", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Environment_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Environment", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Experiment = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Experiment", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Experiment", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Experiment_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Experiment", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Experiment = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Experiment", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Experiment", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Experiment_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Experiment", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Experiment = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Experiment", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Experiment", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Experiment_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Experiment", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_ExperimentalUnit = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_ExperimentalUnit", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_ExperimentalUnit", [ids, fields]);
        return resp[0];
    }

    this.get_entity_ExperimentalUnit_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_ExperimentalUnit", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_ExperimentalUnit = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_ExperimentalUnit", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_ExperimentalUnit", [qry, fields]);
        return resp[0];
    }

    this.query_entity_ExperimentalUnit_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_ExperimentalUnit", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_ExperimentalUnit = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_ExperimentalUnit", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_ExperimentalUnit", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_ExperimentalUnit_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_ExperimentalUnit", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Family = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Family", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Family", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Family_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Family", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Family = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Family", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Family", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Family_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Family", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Family = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Family", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Family", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Family_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Family", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Feature = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Feature", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Feature", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Feature_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Feature", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Feature = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Feature", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Feature", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Feature_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Feature", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Feature = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Feature", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Feature", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Feature_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Feature", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Genome = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Genome", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Genome", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Genome_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Genome", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Genome = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Genome", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Genome", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Genome_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Genome", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Genome = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Genome", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Genome", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Genome_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Genome", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Locality = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Locality", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Locality", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Locality_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Locality", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Locality = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Locality", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Locality", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Locality_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Locality", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Locality = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Locality", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Locality", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Locality_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Locality", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_LocalizedCompound = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_LocalizedCompound", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_LocalizedCompound", [ids, fields]);
        return resp[0];
    }

    this.get_entity_LocalizedCompound_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_LocalizedCompound", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_LocalizedCompound = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_LocalizedCompound", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_LocalizedCompound", [qry, fields]);
        return resp[0];
    }

    this.query_entity_LocalizedCompound_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_LocalizedCompound", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_LocalizedCompound = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_LocalizedCompound", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_LocalizedCompound", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_LocalizedCompound_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_LocalizedCompound", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Location = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Location", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Location", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Location_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Location", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Location = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Location", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Location", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Location_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Location", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Location = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Location", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Location", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Location_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Location", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_LocationInstance = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_LocationInstance", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_LocationInstance", [ids, fields]);
        return resp[0];
    }

    this.get_entity_LocationInstance_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_LocationInstance", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_LocationInstance = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_LocationInstance", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_LocationInstance", [qry, fields]);
        return resp[0];
    }

    this.query_entity_LocationInstance_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_LocationInstance", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_LocationInstance = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_LocationInstance", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_LocationInstance", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_LocationInstance_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_LocationInstance", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Measurement = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Measurement", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Measurement", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Measurement_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Measurement", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Measurement = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Measurement", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Measurement", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Measurement_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Measurement", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Measurement = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Measurement", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Measurement", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Measurement_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Measurement", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Media = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Media", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Media", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Media_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Media", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Media = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Media", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Media", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Media_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Media", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Media = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Media", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Media", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Media_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Media", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Model = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Model", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Model", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Model_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Model", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Model = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Model", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Model", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Model_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Model", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Model = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Model", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Model", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Model_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Model", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_OTU = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_OTU", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_OTU", [ids, fields]);
        return resp[0];
    }

    this.get_entity_OTU_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_OTU", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_OTU = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_OTU", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_OTU", [qry, fields]);
        return resp[0];
    }

    this.query_entity_OTU_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_OTU", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_OTU = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_OTU", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_OTU", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_OTU_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_OTU", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_ObservationalUnit = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_ObservationalUnit", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_ObservationalUnit", [ids, fields]);
        return resp[0];
    }

    this.get_entity_ObservationalUnit_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_ObservationalUnit", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_ObservationalUnit = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_ObservationalUnit", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_ObservationalUnit", [qry, fields]);
        return resp[0];
    }

    this.query_entity_ObservationalUnit_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_ObservationalUnit", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_ObservationalUnit = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_ObservationalUnit", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_ObservationalUnit", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_ObservationalUnit_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_ObservationalUnit", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_PairSet = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_PairSet", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_PairSet", [ids, fields]);
        return resp[0];
    }

    this.get_entity_PairSet_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_PairSet", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_PairSet = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_PairSet", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_PairSet", [qry, fields]);
        return resp[0];
    }

    this.query_entity_PairSet_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_PairSet", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_PairSet = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_PairSet", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_PairSet", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_PairSet_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_PairSet", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Pairing = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Pairing", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Pairing", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Pairing_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Pairing", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Pairing = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Pairing", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Pairing", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Pairing_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Pairing", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Pairing = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Pairing", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Pairing", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Pairing_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Pairing", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Person = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Person", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Person", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Person_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Person", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Person = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Person", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Person", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Person_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Person", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Person = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Person", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Person", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Person_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Person", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_PhenotypeDescription = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_PhenotypeDescription", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_PhenotypeDescription", [ids, fields]);
        return resp[0];
    }

    this.get_entity_PhenotypeDescription_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_PhenotypeDescription", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_PhenotypeDescription = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_PhenotypeDescription", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_PhenotypeDescription", [qry, fields]);
        return resp[0];
    }

    this.query_entity_PhenotypeDescription_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_PhenotypeDescription", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_PhenotypeDescription = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_PhenotypeDescription", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_PhenotypeDescription", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_PhenotypeDescription_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_PhenotypeDescription", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_PhenotypeExperiment = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_PhenotypeExperiment", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_PhenotypeExperiment", [ids, fields]);
        return resp[0];
    }

    this.get_entity_PhenotypeExperiment_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_PhenotypeExperiment", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_PhenotypeExperiment = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_PhenotypeExperiment", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_PhenotypeExperiment", [qry, fields]);
        return resp[0];
    }

    this.query_entity_PhenotypeExperiment_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_PhenotypeExperiment", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_PhenotypeExperiment = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_PhenotypeExperiment", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_PhenotypeExperiment", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_PhenotypeExperiment_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_PhenotypeExperiment", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_ProbeSet = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_ProbeSet", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_ProbeSet", [ids, fields]);
        return resp[0];
    }

    this.get_entity_ProbeSet_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_ProbeSet", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_ProbeSet = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_ProbeSet", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_ProbeSet", [qry, fields]);
        return resp[0];
    }

    this.query_entity_ProbeSet_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_ProbeSet", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_ProbeSet = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_ProbeSet", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_ProbeSet", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_ProbeSet_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_ProbeSet", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_ProteinSequence = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_ProteinSequence", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_ProteinSequence", [ids, fields]);
        return resp[0];
    }

    this.get_entity_ProteinSequence_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_ProteinSequence", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_ProteinSequence = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_ProteinSequence", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_ProteinSequence", [qry, fields]);
        return resp[0];
    }

    this.query_entity_ProteinSequence_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_ProteinSequence", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_ProteinSequence = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_ProteinSequence", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_ProteinSequence", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_ProteinSequence_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_ProteinSequence", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Protocol = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Protocol", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Protocol", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Protocol_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Protocol", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Protocol = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Protocol", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Protocol", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Protocol_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Protocol", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Protocol = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Protocol", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Protocol", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Protocol_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Protocol", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Publication = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Publication", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Publication", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Publication_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Publication", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Publication = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Publication", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Publication", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Publication_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Publication", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Publication = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Publication", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Publication", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Publication_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Publication", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Reaction = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Reaction", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Reaction", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Reaction_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Reaction", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Reaction = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Reaction", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Reaction", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Reaction_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Reaction", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Reaction = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Reaction", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Reaction", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Reaction_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Reaction", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_ReactionInstance = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_ReactionInstance", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_ReactionInstance", [ids, fields]);
        return resp[0];
    }

    this.get_entity_ReactionInstance_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_ReactionInstance", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_ReactionInstance = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_ReactionInstance", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_ReactionInstance", [qry, fields]);
        return resp[0];
    }

    this.query_entity_ReactionInstance_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_ReactionInstance", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_ReactionInstance = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_ReactionInstance", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_ReactionInstance", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_ReactionInstance_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_ReactionInstance", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Role = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Role", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Role", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Role_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Role", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Role = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Role", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Role", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Role_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Role", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Role = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Role", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Role", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Role_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Role", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_SSCell = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_SSCell", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_SSCell", [ids, fields]);
        return resp[0];
    }

    this.get_entity_SSCell_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_SSCell", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_SSCell = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_SSCell", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_SSCell", [qry, fields]);
        return resp[0];
    }

    this.query_entity_SSCell_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_SSCell", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_SSCell = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_SSCell", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_SSCell", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_SSCell_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_SSCell", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_SSRow = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_SSRow", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_SSRow", [ids, fields]);
        return resp[0];
    }

    this.get_entity_SSRow_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_SSRow", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_SSRow = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_SSRow", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_SSRow", [qry, fields]);
        return resp[0];
    }

    this.query_entity_SSRow_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_SSRow", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_SSRow = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_SSRow", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_SSRow", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_SSRow_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_SSRow", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Scenario = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Scenario", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Scenario", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Scenario_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Scenario", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Scenario = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Scenario", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Scenario", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Scenario_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Scenario", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Scenario = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Scenario", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Scenario", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Scenario_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Scenario", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Source = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Source", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Source", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Source_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Source", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Source = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Source", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Source", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Source_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Source", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Source = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Source", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Source", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Source_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Source", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Strain = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Strain", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Strain", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Strain_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Strain", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Strain = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Strain", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Strain", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Strain_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Strain", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Strain = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Strain", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Strain", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Strain_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Strain", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_StudyExperiment = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_StudyExperiment", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_StudyExperiment", [ids, fields]);
        return resp[0];
    }

    this.get_entity_StudyExperiment_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_StudyExperiment", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_StudyExperiment = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_StudyExperiment", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_StudyExperiment", [qry, fields]);
        return resp[0];
    }

    this.query_entity_StudyExperiment_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_StudyExperiment", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_StudyExperiment = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_StudyExperiment", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_StudyExperiment", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_StudyExperiment_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_StudyExperiment", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Subsystem = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Subsystem", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Subsystem", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Subsystem_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Subsystem", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Subsystem = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Subsystem", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Subsystem", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Subsystem_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Subsystem", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Subsystem = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Subsystem", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Subsystem", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Subsystem_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Subsystem", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_SubsystemClass = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_SubsystemClass", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_SubsystemClass", [ids, fields]);
        return resp[0];
    }

    this.get_entity_SubsystemClass_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_SubsystemClass", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_SubsystemClass = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_SubsystemClass", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_SubsystemClass", [qry, fields]);
        return resp[0];
    }

    this.query_entity_SubsystemClass_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_SubsystemClass", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_SubsystemClass = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_SubsystemClass", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_SubsystemClass", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_SubsystemClass_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_SubsystemClass", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_TaxonomicGrouping = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_TaxonomicGrouping", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_TaxonomicGrouping", [ids, fields]);
        return resp[0];
    }

    this.get_entity_TaxonomicGrouping_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_TaxonomicGrouping", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_TaxonomicGrouping = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_TaxonomicGrouping", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_TaxonomicGrouping", [qry, fields]);
        return resp[0];
    }

    this.query_entity_TaxonomicGrouping_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_TaxonomicGrouping", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_TaxonomicGrouping = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_TaxonomicGrouping", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_TaxonomicGrouping", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_TaxonomicGrouping_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_TaxonomicGrouping", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Trait = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Trait", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Trait", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Trait_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Trait", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Trait = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Trait", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Trait", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Trait_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Trait", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Trait = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Trait", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Trait", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Trait_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Trait", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Tree = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Tree", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Tree", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Tree_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Tree", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Tree = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Tree", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Tree", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Tree_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Tree", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Tree = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Tree", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Tree", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Tree_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Tree", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_TreeAttribute = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_TreeAttribute", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_TreeAttribute", [ids, fields]);
        return resp[0];
    }

    this.get_entity_TreeAttribute_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_TreeAttribute", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_TreeAttribute = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_TreeAttribute", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_TreeAttribute", [qry, fields]);
        return resp[0];
    }

    this.query_entity_TreeAttribute_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_TreeAttribute", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_TreeAttribute = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_TreeAttribute", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_TreeAttribute", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_TreeAttribute_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_TreeAttribute", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_TreeNodeAttribute = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_TreeNodeAttribute", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_TreeNodeAttribute", [ids, fields]);
        return resp[0];
    }

    this.get_entity_TreeNodeAttribute_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_TreeNodeAttribute", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_TreeNodeAttribute = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_TreeNodeAttribute", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_TreeNodeAttribute", [qry, fields]);
        return resp[0];
    }

    this.query_entity_TreeNodeAttribute_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_TreeNodeAttribute", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_TreeNodeAttribute = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_TreeNodeAttribute", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_TreeNodeAttribute", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_TreeNodeAttribute_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_TreeNodeAttribute", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Variant = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Variant", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Variant", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Variant_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Variant", [ids, fields], 1, _callback, _error_callback)
    }

    this.query_entity_Variant = function(qry, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.query_entity_Variant", [qry, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.query_entity_Variant", [qry, fields]);
        return resp[0];
    }

    this.query_entity_Variant_async = function(qry, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.query_entity_Variant", [qry, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Variant = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Variant", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Variant", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Variant_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Variant", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_relationship_AffectsLevelOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_AffectsLevelOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_AffectsLevelOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_AffectsLevelOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_AffectsLevelOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsAffectedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsAffectedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsAffectedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsAffectedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsAffectedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Aligned = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Aligned", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Aligned", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Aligned_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Aligned", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_WasAlignedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_WasAlignedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_WasAlignedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_WasAlignedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_WasAlignedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_AssertsFunctionFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_AssertsFunctionFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_AssertsFunctionFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_AssertsFunctionFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_AssertsFunctionFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasAssertedFunctionFrom = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasAssertedFunctionFrom", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasAssertedFunctionFrom", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasAssertedFunctionFrom_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasAssertedFunctionFrom", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_BelongsTo = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_BelongsTo", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_BelongsTo", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_BelongsTo_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_BelongsTo", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IncludesStrain = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IncludesStrain", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IncludesStrain", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IncludesStrain_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IncludesStrain", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Concerns = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Concerns", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Concerns", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Concerns_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Concerns", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsATopicOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsATopicOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsATopicOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsATopicOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsATopicOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_ConsistsOfCompounds = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_ConsistsOfCompounds", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_ConsistsOfCompounds", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_ConsistsOfCompounds_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_ConsistsOfCompounds", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_ComponentOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_ComponentOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_ComponentOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_ComponentOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_ComponentOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Contains = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Contains", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Contains", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Contains_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Contains", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsContainedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsContainedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsContainedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsContainedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsContainedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_ContainsAlignedDNA = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_ContainsAlignedDNA", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_ContainsAlignedDNA", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_ContainsAlignedDNA_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_ContainsAlignedDNA", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsAlignedDNAComponentOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsAlignedDNAComponentOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsAlignedDNAComponentOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsAlignedDNAComponentOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsAlignedDNAComponentOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_ContainsAlignedProtein = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_ContainsAlignedProtein", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_ContainsAlignedProtein", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_ContainsAlignedProtein_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_ContainsAlignedProtein", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsAlignedProteinComponentOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsAlignedProteinComponentOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsAlignedProteinComponentOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsAlignedProteinComponentOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsAlignedProteinComponentOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Controls = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Controls", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Controls", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Controls_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Controls", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsControlledUsing = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsControlledUsing", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsControlledUsing", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsControlledUsing_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsControlledUsing", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_DerivedFromStrain = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_DerivedFromStrain", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_DerivedFromStrain", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_DerivedFromStrain_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_DerivedFromStrain", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_StrainParentOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_StrainParentOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_StrainParentOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_StrainParentOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_StrainParentOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Describes = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Describes", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Describes", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Describes_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Describes", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsDescribedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsDescribedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsDescribedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsDescribedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsDescribedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_DescribesAlignment = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_DescribesAlignment", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_DescribesAlignment", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_DescribesAlignment_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_DescribesAlignment", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasAlignmentAttribute = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasAlignmentAttribute", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasAlignmentAttribute", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasAlignmentAttribute_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasAlignmentAttribute", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_DescribesTree = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_DescribesTree", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_DescribesTree", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_DescribesTree_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_DescribesTree", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasTreeAttribute = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasTreeAttribute", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasTreeAttribute", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasTreeAttribute_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasTreeAttribute", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_DescribesTreeNode = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_DescribesTreeNode", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_DescribesTreeNode", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_DescribesTreeNode_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_DescribesTreeNode", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasNodeAttribute = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasNodeAttribute", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasNodeAttribute", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasNodeAttribute_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasNodeAttribute", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Displays = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Displays", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Displays", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Displays_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Displays", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsDisplayedOn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsDisplayedOn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsDisplayedOn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsDisplayedOn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsDisplayedOn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Encompasses = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Encompasses", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Encompasses", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Encompasses_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Encompasses", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsEncompassedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsEncompassedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsEncompassedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsEncompassedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsEncompassedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Formulated = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Formulated", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Formulated", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Formulated_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Formulated", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_WasFormulatedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_WasFormulatedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_WasFormulatedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_WasFormulatedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_WasFormulatedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_GeneratedLevelsFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_GeneratedLevelsFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_GeneratedLevelsFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_GeneratedLevelsFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_GeneratedLevelsFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_WasGeneratedFrom = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_WasGeneratedFrom", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_WasGeneratedFrom", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_WasGeneratedFrom_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_WasGeneratedFrom", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_GenomeParentOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_GenomeParentOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_GenomeParentOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_GenomeParentOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_GenomeParentOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_DerivedFromGenome = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_DerivedFromGenome", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_DerivedFromGenome", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_DerivedFromGenome_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_DerivedFromGenome", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasAssociatedMeasurement = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasAssociatedMeasurement", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasAssociatedMeasurement", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasAssociatedMeasurement_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasAssociatedMeasurement", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_MeasuresPhenotype = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_MeasuresPhenotype", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_MeasuresPhenotype", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_MeasuresPhenotype_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_MeasuresPhenotype", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasCompoundAliasFrom = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasCompoundAliasFrom", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasCompoundAliasFrom", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasCompoundAliasFrom_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasCompoundAliasFrom", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_UsesAliasForCompound = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_UsesAliasForCompound", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_UsesAliasForCompound", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_UsesAliasForCompound_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_UsesAliasForCompound", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasExperimentalUnit = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasExperimentalUnit", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasExperimentalUnit", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasExperimentalUnit_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasExperimentalUnit", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsExperimentalUnitOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsExperimentalUnitOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsExperimentalUnitOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsExperimentalUnitOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsExperimentalUnitOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasIndicatedSignalFrom = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasIndicatedSignalFrom", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasIndicatedSignalFrom", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasIndicatedSignalFrom_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasIndicatedSignalFrom", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IndicatesSignalFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IndicatesSignalFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IndicatesSignalFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IndicatesSignalFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IndicatesSignalFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasKnockoutIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasKnockoutIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasKnockoutIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasKnockoutIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasKnockoutIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_KnockedOutIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_KnockedOutIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_KnockedOutIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_KnockedOutIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_KnockedOutIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasMeasurement = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasMeasurement", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasMeasurement", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasMeasurement_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasMeasurement", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsMeasureOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsMeasureOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsMeasureOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsMeasureOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsMeasureOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasMember = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasMember", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasMember", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasMember_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasMember", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsMemberOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsMemberOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsMemberOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsMemberOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsMemberOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasParticipant = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasParticipant", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasParticipant", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasParticipant_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasParticipant", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_ParticipatesIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_ParticipatesIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_ParticipatesIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_ParticipatesIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_ParticipatesIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasPresenceOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasPresenceOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasPresenceOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasPresenceOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasPresenceOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsPresentIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsPresentIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsPresentIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsPresentIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsPresentIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasProteinMember = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasProteinMember", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasProteinMember", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasProteinMember_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasProteinMember", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsProteinMemberOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsProteinMemberOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsProteinMemberOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsProteinMemberOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsProteinMemberOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasReactionAliasFrom = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasReactionAliasFrom", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasReactionAliasFrom", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasReactionAliasFrom_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasReactionAliasFrom", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_UsesAliasForReaction = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_UsesAliasForReaction", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_UsesAliasForReaction", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_UsesAliasForReaction_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_UsesAliasForReaction", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasRepresentativeOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasRepresentativeOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasRepresentativeOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasRepresentativeOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasRepresentativeOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsRepresentedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsRepresentedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsRepresentedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsRepresentedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsRepresentedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasRequirementOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasRequirementOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasRequirementOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasRequirementOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasRequirementOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsARequirementOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsARequirementOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsARequirementOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsARequirementOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsARequirementOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasResultsIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasResultsIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasResultsIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasResultsIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasResultsIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasResultsFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasResultsFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasResultsFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasResultsFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasResultsFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasSection = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasSection", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasSection", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasSection_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasSection", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsSectionOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsSectionOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsSectionOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsSectionOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsSectionOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasStep = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasStep", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasStep", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasStep_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasStep", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsStepOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsStepOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsStepOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsStepOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsStepOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasTrait = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasTrait", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasTrait", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasTrait_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasTrait", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Measures = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Measures", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Measures", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Measures_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Measures", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasUnits = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasUnits", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasUnits", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasUnits_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasUnits", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsLocated = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsLocated", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsLocated", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsLocated_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsLocated", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasUsage = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasUsage", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasUsage", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasUsage_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasUsage", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsUsageOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsUsageOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsUsageOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsUsageOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsUsageOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasValueFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasValueFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasValueFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasValueFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasValueFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasValueIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasValueIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasValueIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasValueIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasValueIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasVariationIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasVariationIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasVariationIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasVariationIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasVariationIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsVariedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsVariedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsVariedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsVariedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsVariedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Impacts = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Impacts", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Impacts", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Impacts_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Impacts", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsImpactedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsImpactedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsImpactedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsImpactedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsImpactedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_ImplementsReaction = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_ImplementsReaction", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_ImplementsReaction", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_ImplementsReaction_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_ImplementsReaction", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_ImplementedBasedOn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_ImplementedBasedOn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_ImplementedBasedOn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_ImplementedBasedOn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_ImplementedBasedOn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Includes = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Includes", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Includes", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Includes_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Includes", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsIncludedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsIncludedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsIncludedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsIncludedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsIncludedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IncludesAdditionalCompounds = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IncludesAdditionalCompounds", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IncludesAdditionalCompounds", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IncludesAdditionalCompounds_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IncludesAdditionalCompounds", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IncludedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IncludedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IncludedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IncludedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IncludedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IncludesAlignmentRow = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IncludesAlignmentRow", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IncludesAlignmentRow", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IncludesAlignmentRow_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IncludesAlignmentRow", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsAlignmentRowIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsAlignmentRowIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsAlignmentRowIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsAlignmentRowIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsAlignmentRowIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IncludesPart = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IncludesPart", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IncludesPart", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IncludesPart_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IncludesPart", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsPartOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsPartOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsPartOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsPartOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsPartOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IndicatedLevelsFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IndicatedLevelsFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IndicatedLevelsFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IndicatedLevelsFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IndicatedLevelsFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasLevelsFrom = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasLevelsFrom", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasLevelsFrom", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasLevelsFrom_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasLevelsFrom", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Involves = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Involves", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Involves", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Involves_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Involves", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsInvolvedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsInvolvedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsInvolvedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsInvolvedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsInvolvedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsAnnotatedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsAnnotatedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsAnnotatedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsAnnotatedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsAnnotatedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Annotates = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Annotates", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Annotates", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Annotates_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Annotates", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsAssayOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsAssayOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsAssayOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsAssayOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsAssayOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsAssayedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsAssayedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsAssayedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsAssayedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsAssayedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsClassFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsClassFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsClassFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsClassFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsClassFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsInClass = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsInClass", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsInClass", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsInClass_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsInClass", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsCollectionOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsCollectionOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsCollectionOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsCollectionOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsCollectionOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsCollectedInto = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsCollectedInto", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsCollectedInto", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsCollectedInto_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsCollectedInto", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsComposedOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsComposedOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsComposedOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsComposedOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsComposedOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsComponentOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsComponentOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsComponentOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsComponentOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsComponentOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsComprisedOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsComprisedOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsComprisedOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsComprisedOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsComprisedOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Comprises = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Comprises", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Comprises", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Comprises_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Comprises", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsConfiguredBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsConfiguredBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsConfiguredBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsConfiguredBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsConfiguredBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_ReflectsStateOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_ReflectsStateOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_ReflectsStateOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_ReflectsStateOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_ReflectsStateOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsConsistentWith = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsConsistentWith", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsConsistentWith", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsConsistentWith_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsConsistentWith", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsConsistentTo = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsConsistentTo", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsConsistentTo", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsConsistentTo_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsConsistentTo", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsCoregulatedWith = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsCoregulatedWith", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsCoregulatedWith", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsCoregulatedWith_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsCoregulatedWith", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasCoregulationWith = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasCoregulationWith", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasCoregulationWith", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasCoregulationWith_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasCoregulationWith", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsCoupledTo = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsCoupledTo", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsCoupledTo", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsCoupledTo_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsCoupledTo", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsCoupledWith = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsCoupledWith", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsCoupledWith", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsCoupledWith_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsCoupledWith", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsDeterminedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsDeterminedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsDeterminedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsDeterminedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsDeterminedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Determines = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Determines", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Determines", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Determines_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Determines", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsDividedInto = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsDividedInto", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsDividedInto", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsDividedInto_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsDividedInto", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsDivisionOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsDivisionOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsDivisionOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsDivisionOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsDivisionOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsExecutedAs = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsExecutedAs", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsExecutedAs", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsExecutedAs_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsExecutedAs", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsExecutionOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsExecutionOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsExecutionOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsExecutionOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsExecutionOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsExemplarOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsExemplarOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsExemplarOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsExemplarOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsExemplarOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasAsExemplar = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasAsExemplar", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasAsExemplar", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasAsExemplar_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasAsExemplar", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsFamilyFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsFamilyFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsFamilyFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsFamilyFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsFamilyFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_DeterminesFunctionOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_DeterminesFunctionOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_DeterminesFunctionOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_DeterminesFunctionOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_DeterminesFunctionOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsFormedOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsFormedOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsFormedOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsFormedOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsFormedOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsFormedInto = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsFormedInto", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsFormedInto", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsFormedInto_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsFormedInto", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsFunctionalIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsFunctionalIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsFunctionalIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsFunctionalIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsFunctionalIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasFunctional = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasFunctional", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasFunctional", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasFunctional_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasFunctional", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsGroupFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsGroupFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsGroupFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsGroupFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsGroupFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsInGroup = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsInGroup", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsInGroup", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsInGroup_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsInGroup", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsImplementedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsImplementedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsImplementedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsImplementedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsImplementedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Implements = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Implements", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Implements", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Implements_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Implements", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsInPair = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsInPair", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsInPair", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsInPair_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsInPair", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsPairOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsPairOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsPairOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsPairOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsPairOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsInstantiatedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsInstantiatedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsInstantiatedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsInstantiatedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsInstantiatedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsInstanceOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsInstanceOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsInstanceOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsInstanceOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsInstanceOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsLocatedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsLocatedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsLocatedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsLocatedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsLocatedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsLocusFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsLocusFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsLocusFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsLocusFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsLocusFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsMeasurementMethodOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsMeasurementMethodOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsMeasurementMethodOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsMeasurementMethodOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsMeasurementMethodOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_WasMeasuredBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_WasMeasuredBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_WasMeasuredBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_WasMeasuredBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_WasMeasuredBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsModeledBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsModeledBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsModeledBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsModeledBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsModeledBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Models = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Models", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Models", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Models_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Models", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsModifiedToBuildAlignment = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsModifiedToBuildAlignment", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsModifiedToBuildAlignment", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsModifiedToBuildAlignment_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsModifiedToBuildAlignment", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsModificationOfAlignment = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsModificationOfAlignment", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsModificationOfAlignment", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsModificationOfAlignment_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsModificationOfAlignment", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsModifiedToBuildTree = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsModifiedToBuildTree", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsModifiedToBuildTree", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsModifiedToBuildTree_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsModifiedToBuildTree", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsModificationOfTree = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsModificationOfTree", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsModificationOfTree", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsModificationOfTree_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsModificationOfTree", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsOwnerOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsOwnerOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsOwnerOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsOwnerOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsOwnerOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsOwnedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsOwnedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsOwnedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsOwnedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsOwnedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsParticipatingAt = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsParticipatingAt", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsParticipatingAt", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsParticipatingAt_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsParticipatingAt", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_ParticipatesAt = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_ParticipatesAt", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_ParticipatesAt", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_ParticipatesAt_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_ParticipatesAt", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsProteinFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsProteinFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsProteinFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsProteinFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsProteinFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Produces = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Produces", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Produces", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Produces_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Produces", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsReagentIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsReagentIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsReagentIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsReagentIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsReagentIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Targets = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Targets", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Targets", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Targets_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Targets", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsRealLocationOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsRealLocationOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsRealLocationOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsRealLocationOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsRealLocationOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasRealLocationIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasRealLocationIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasRealLocationIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasRealLocationIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasRealLocationIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsReferencedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsReferencedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsReferencedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsReferencedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsReferencedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_UsesReference = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_UsesReference", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_UsesReference", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_UsesReference_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_UsesReference", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsRegulatedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsRegulatedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsRegulatedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsRegulatedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsRegulatedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsRegulatedSetOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsRegulatedSetOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsRegulatedSetOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsRegulatedSetOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsRegulatedSetOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsRelevantFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsRelevantFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsRelevantFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsRelevantFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsRelevantFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsRelevantTo = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsRelevantTo", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsRelevantTo", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsRelevantTo_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsRelevantTo", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsRepresentedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsRepresentedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsRepresentedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsRepresentedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsRepresentedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_DefinedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_DefinedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_DefinedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_DefinedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_DefinedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsRoleOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsRoleOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsRoleOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsRoleOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsRoleOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasRole = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasRole", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasRole", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasRole_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasRole", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsRowOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsRowOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsRowOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsRowOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsRowOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsRoleFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsRoleFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsRoleFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsRoleFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsRoleFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsSequenceOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsSequenceOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsSequenceOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsSequenceOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsSequenceOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasAsSequence = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasAsSequence", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasAsSequence", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasAsSequence_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasAsSequence", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsSubInstanceOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsSubInstanceOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsSubInstanceOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsSubInstanceOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsSubInstanceOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Validates = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Validates", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Validates", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Validates_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Validates", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsSummarizedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsSummarizedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsSummarizedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsSummarizedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsSummarizedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Summarizes = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Summarizes", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Summarizes", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Summarizes_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Summarizes", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsSuperclassOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsSuperclassOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsSuperclassOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsSuperclassOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsSuperclassOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsSubclassOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsSubclassOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsSubclassOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsSubclassOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsSubclassOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsTaxonomyOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsTaxonomyOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsTaxonomyOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsTaxonomyOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsTaxonomyOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsInTaxa = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsInTaxa", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsInTaxa", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsInTaxa_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsInTaxa", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsTerminusFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsTerminusFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsTerminusFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsTerminusFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsTerminusFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasAsTerminus = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasAsTerminus", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasAsTerminus", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasAsTerminus_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasAsTerminus", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsTriggeredBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsTriggeredBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsTriggeredBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsTriggeredBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsTriggeredBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Triggers = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Triggers", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Triggers", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Triggers_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Triggers", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsUsedToBuildTree = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsUsedToBuildTree", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsUsedToBuildTree", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsUsedToBuildTree_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsUsedToBuildTree", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsBuiltFromAlignment = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsBuiltFromAlignment", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsBuiltFromAlignment", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsBuiltFromAlignment_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsBuiltFromAlignment", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Manages = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Manages", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Manages", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Manages_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Manages", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsManagedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsManagedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsManagedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsManagedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsManagedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_OperatesIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_OperatesIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_OperatesIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_OperatesIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_OperatesIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsUtilizedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsUtilizedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsUtilizedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsUtilizedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsUtilizedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Overlaps = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Overlaps", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Overlaps", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Overlaps_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Overlaps", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IncludesPartOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IncludesPartOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IncludesPartOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IncludesPartOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IncludesPartOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_ParticipatesAs = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_ParticipatesAs", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_ParticipatesAs", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_ParticipatesAs_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_ParticipatesAs", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsParticipationOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsParticipationOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsParticipationOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsParticipationOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsParticipationOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_PerformedExperiment = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_PerformedExperiment", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_PerformedExperiment", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_PerformedExperiment_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_PerformedExperiment", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_PerformedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_PerformedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_PerformedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_PerformedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_PerformedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_ProducedResultsFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_ProducedResultsFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_ProducedResultsFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_ProducedResultsFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_ProducedResultsFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HadResultsProducedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HadResultsProducedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HadResultsProducedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HadResultsProducedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HadResultsProducedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Provided = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Provided", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Provided", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Provided_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Provided", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_WasProvidedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_WasProvidedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_WasProvidedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_WasProvidedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_WasProvidedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_PublishedExperiment = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_PublishedExperiment", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_PublishedExperiment", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_PublishedExperiment_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_PublishedExperiment", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_ExperimentPublishedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_ExperimentPublishedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_ExperimentPublishedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_ExperimentPublishedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_ExperimentPublishedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_PublishedProtocol = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_PublishedProtocol", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_PublishedProtocol", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_PublishedProtocol_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_PublishedProtocol", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_ProtocolPublishedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_ProtocolPublishedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_ProtocolPublishedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_ProtocolPublishedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_ProtocolPublishedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Shows = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Shows", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Shows", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Shows_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Shows", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsShownOn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsShownOn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsShownOn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsShownOn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsShownOn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Submitted = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Submitted", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Submitted", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Submitted_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Submitted", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_WasSubmittedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_WasSubmittedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_WasSubmittedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_WasSubmittedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_WasSubmittedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_SupersedesAlignment = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_SupersedesAlignment", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_SupersedesAlignment", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_SupersedesAlignment_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_SupersedesAlignment", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsSupersededByAlignment = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsSupersededByAlignment", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsSupersededByAlignment", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsSupersededByAlignment_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsSupersededByAlignment", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_SupersedesTree = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_SupersedesTree", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_SupersedesTree", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_SupersedesTree_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_SupersedesTree", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsSupersededByTree = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsSupersededByTree", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsSupersededByTree", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsSupersededByTree_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsSupersededByTree", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Treed = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Treed", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Treed", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Treed_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Treed", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsTreeFrom = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsTreeFrom", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsTreeFrom", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsTreeFrom_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsTreeFrom", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_UsedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_UsedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_UsedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_UsedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_UsedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_UsesMedia = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_UsesMedia", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_UsesMedia", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_UsesMedia_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_UsesMedia", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_UsedInExperimentalUnit = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_UsedInExperimentalUnit", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_UsedInExperimentalUnit", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_UsedInExperimentalUnit_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_UsedInExperimentalUnit", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasEnvironment = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasEnvironment", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasEnvironment", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasEnvironment_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasEnvironment", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Uses = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Uses", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Uses", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Uses_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Uses", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsUsedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsUsedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsUsedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsUsedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsUsedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_UsesCodons = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_UsesCodons", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_UsesCodons", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_UsesCodons_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_UsesCodons", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_AreCodonsFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_AreCodonsFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_AreCodonsFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_AreCodonsFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_AreCodonsFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}

 


function KBaseRegPrecise(url) {

    var _url = url;


    this.getRegulomeModelCollections = function()
    {
	var resp = json_call_ajax_sync("KBaseRegPrecise.getRegulomeModelCollections", []);
//	var resp = json_call_sync("KBaseRegPrecise.getRegulomeModelCollections", []);
        return resp[0];
    }

    this.getRegulomeModelCollections_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("KBaseRegPrecise.getRegulomeModelCollections", [], 1, _callback, _error_callback)
    }

    this.getRegulomeModelCollection = function(collectionId)
    {
	var resp = json_call_ajax_sync("KBaseRegPrecise.getRegulomeModelCollection", [collectionId]);
//	var resp = json_call_sync("KBaseRegPrecise.getRegulomeModelCollection", [collectionId]);
        return resp[0];
    }

    this.getRegulomeModelCollection_async = function(collectionId, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseRegPrecise.getRegulomeModelCollection", [collectionId], 1, _callback, _error_callback)
    }

    this.getRegulomeModelsByCollectionId = function(collectionId)
    {
	var resp = json_call_ajax_sync("KBaseRegPrecise.getRegulomeModelsByCollectionId", [collectionId]);
//	var resp = json_call_sync("KBaseRegPrecise.getRegulomeModelsByCollectionId", [collectionId]);
        return resp[0];
    }

    this.getRegulomeModelsByCollectionId_async = function(collectionId, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseRegPrecise.getRegulomeModelsByCollectionId", [collectionId], 1, _callback, _error_callback)
    }

    this.getRegulomeModelsByGenomeId = function(genomeId)
    {
	var resp = json_call_ajax_sync("KBaseRegPrecise.getRegulomeModelsByGenomeId", [genomeId]);
//	var resp = json_call_sync("KBaseRegPrecise.getRegulomeModelsByGenomeId", [genomeId]);
        return resp[0];
    }

    this.getRegulomeModelsByGenomeId_async = function(genomeId, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseRegPrecise.getRegulomeModelsByGenomeId", [genomeId], 1, _callback, _error_callback)
    }

    this.getRegulomeModelsBySourceType = function(regulomeSource)
    {
	var resp = json_call_ajax_sync("KBaseRegPrecise.getRegulomeModelsBySourceType", [regulomeSource]);
//	var resp = json_call_sync("KBaseRegPrecise.getRegulomeModelsBySourceType", [regulomeSource]);
        return resp[0];
    }

    this.getRegulomeModelsBySourceType_async = function(regulomeSource, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseRegPrecise.getRegulomeModelsBySourceType", [regulomeSource], 1, _callback, _error_callback)
    }

    this.getRegulomeModel = function(regulomeModelId)
    {
	var resp = json_call_ajax_sync("KBaseRegPrecise.getRegulomeModel", [regulomeModelId]);
//	var resp = json_call_sync("KBaseRegPrecise.getRegulomeModel", [regulomeModelId]);
        return resp[0];
    }

    this.getRegulomeModel_async = function(regulomeModelId, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseRegPrecise.getRegulomeModel", [regulomeModelId], 1, _callback, _error_callback)
    }

    this.getRegulonModelStats = function(regulomeModelId)
    {
	var resp = json_call_ajax_sync("KBaseRegPrecise.getRegulonModelStats", [regulomeModelId]);
//	var resp = json_call_sync("KBaseRegPrecise.getRegulonModelStats", [regulomeModelId]);
        return resp[0];
    }

    this.getRegulonModelStats_async = function(regulomeModelId, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseRegPrecise.getRegulonModelStats", [regulomeModelId], 1, _callback, _error_callback)
    }

    this.getRegulonModel = function(regulonModelId)
    {
	var resp = json_call_ajax_sync("KBaseRegPrecise.getRegulonModel", [regulonModelId]);
//	var resp = json_call_sync("KBaseRegPrecise.getRegulonModel", [regulonModelId]);
        return resp[0];
    }

    this.getRegulonModel_async = function(regulonModelId, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseRegPrecise.getRegulonModel", [regulonModelId], 1, _callback, _error_callback)
    }

    this.buildRegulomeModel = function(param)
    {
	var resp = json_call_ajax_sync("KBaseRegPrecise.buildRegulomeModel", [param]);
//	var resp = json_call_sync("KBaseRegPrecise.buildRegulomeModel", [param]);
        return resp[0];
    }

    this.buildRegulomeModel_async = function(param, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseRegPrecise.buildRegulomeModel", [param], 1, _callback, _error_callback)
    }

    this.getProcessState = function(processId)
    {
	var resp = json_call_ajax_sync("KBaseRegPrecise.getProcessState", [processId]);
//	var resp = json_call_sync("KBaseRegPrecise.getProcessState", [processId]);
        return resp[0];
    }

    this.getProcessState_async = function(processId, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseRegPrecise.getProcessState", [processId], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function MOTranslation(url) {

    var _url = url;


    this.fids_to_moLocusIds = function(fids)
    {
	var resp = json_call_ajax_sync("MOTranslation.fids_to_moLocusIds", [fids]);
//	var resp = json_call_sync("MOTranslation.fids_to_moLocusIds", [fids]);
        return resp[0];
    }

    this.fids_to_moLocusIds_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("MOTranslation.fids_to_moLocusIds", [fids], 1, _callback, _error_callback)
    }

    this.proteins_to_moLocusIds = function(proteins)
    {
	var resp = json_call_ajax_sync("MOTranslation.proteins_to_moLocusIds", [proteins]);
//	var resp = json_call_sync("MOTranslation.proteins_to_moLocusIds", [proteins]);
        return resp[0];
    }

    this.proteins_to_moLocusIds_async = function(proteins, _callback, _error_callback)
    {
	json_call_ajax_async("MOTranslation.proteins_to_moLocusIds", [proteins], 1, _callback, _error_callback)
    }

    this.moLocusIds_to_fids = function(moLocusIds)
    {
	var resp = json_call_ajax_sync("MOTranslation.moLocusIds_to_fids", [moLocusIds]);
//	var resp = json_call_sync("MOTranslation.moLocusIds_to_fids", [moLocusIds]);
        return resp[0];
    }

    this.moLocusIds_to_fids_async = function(moLocusIds, _callback, _error_callback)
    {
	json_call_ajax_async("MOTranslation.moLocusIds_to_fids", [moLocusIds], 1, _callback, _error_callback)
    }

    this.moLocusIds_to_proteins = function(moLocusIds)
    {
	var resp = json_call_ajax_sync("MOTranslation.moLocusIds_to_proteins", [moLocusIds]);
//	var resp = json_call_sync("MOTranslation.moLocusIds_to_proteins", [moLocusIds]);
        return resp[0];
    }

    this.moLocusIds_to_proteins_async = function(moLocusIds, _callback, _error_callback)
    {
	json_call_ajax_async("MOTranslation.moLocusIds_to_proteins", [moLocusIds], 1, _callback, _error_callback)
    }

    this.map_to_fid = function(query_sequences, genomeId)
    {
	var resp = json_call_ajax_sync("MOTranslation.map_to_fid", [query_sequences, genomeId]);
//	var resp = json_call_sync("MOTranslation.map_to_fid", [query_sequences, genomeId]);
        return resp;
    }

    this.map_to_fid_async = function(query_sequences, genomeId, _callback, _error_callback)
    {
	json_call_ajax_async("MOTranslation.map_to_fid", [query_sequences, genomeId], 2, _callback, _error_callback)
    }

    this.map_to_fid_fast = function(query_md5s, genomeId)
    {
	var resp = json_call_ajax_sync("MOTranslation.map_to_fid_fast", [query_md5s, genomeId]);
//	var resp = json_call_sync("MOTranslation.map_to_fid_fast", [query_md5s, genomeId]);
        return resp;
    }

    this.map_to_fid_fast_async = function(query_md5s, genomeId, _callback, _error_callback)
    {
	json_call_ajax_async("MOTranslation.map_to_fid_fast", [query_md5s, genomeId], 2, _callback, _error_callback)
    }

    this.moLocusIds_to_fid_in_genome = function(moLocusIds, genomeId)
    {
	var resp = json_call_ajax_sync("MOTranslation.moLocusIds_to_fid_in_genome", [moLocusIds, genomeId]);
//	var resp = json_call_sync("MOTranslation.moLocusIds_to_fid_in_genome", [moLocusIds, genomeId]);
        return resp;
    }

    this.moLocusIds_to_fid_in_genome_async = function(moLocusIds, genomeId, _callback, _error_callback)
    {
	json_call_ajax_async("MOTranslation.moLocusIds_to_fid_in_genome", [moLocusIds, genomeId], 2, _callback, _error_callback)
    }

    this.moLocusIds_to_fid_in_genome_fast = function(moLocusIds, genomeId)
    {
	var resp = json_call_ajax_sync("MOTranslation.moLocusIds_to_fid_in_genome_fast", [moLocusIds, genomeId]);
//	var resp = json_call_sync("MOTranslation.moLocusIds_to_fid_in_genome_fast", [moLocusIds, genomeId]);
        return resp;
    }

    this.moLocusIds_to_fid_in_genome_fast_async = function(moLocusIds, genomeId, _callback, _error_callback)
    {
	json_call_ajax_async("MOTranslation.moLocusIds_to_fid_in_genome_fast", [moLocusIds, genomeId], 2, _callback, _error_callback)
    }

    this.moTaxonomyId_to_genomes = function(moTaxonomyId)
    {
	var resp = json_call_ajax_sync("MOTranslation.moTaxonomyId_to_genomes", [moTaxonomyId]);
//	var resp = json_call_sync("MOTranslation.moTaxonomyId_to_genomes", [moTaxonomyId]);
        return resp[0];
    }

    this.moTaxonomyId_to_genomes_async = function(moTaxonomyId, _callback, _error_callback)
    {
	json_call_ajax_async("MOTranslation.moTaxonomyId_to_genomes", [moTaxonomyId], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function PlantExpression(url) {

    var _url = url;


    this.getExperimentsBySeriesID = function(ids)
    {
	var resp = json_call_ajax_sync("PlantExpression.getExperimentsBySeriesID", [ids]);
//	var resp = json_call_sync("PlantExpression.getExperimentsBySeriesID", [ids]);
        return resp[0];
    }

    this.getExperimentsBySeriesID_async = function(ids, _callback, _error_callback)
    {
	json_call_ajax_async("PlantExpression.getExperimentsBySeriesID", [ids], 1, _callback, _error_callback)
    }

    this.getExperimentsBySampleID = function(ids)
    {
	var resp = json_call_ajax_sync("PlantExpression.getExperimentsBySampleID", [ids]);
//	var resp = json_call_sync("PlantExpression.getExperimentsBySampleID", [ids]);
        return resp[0];
    }

    this.getExperimentsBySampleID_async = function(ids, _callback, _error_callback)
    {
	json_call_ajax_async("PlantExpression.getExperimentsBySampleID", [ids], 1, _callback, _error_callback)
    }

    this.getExperimentsBySampleIDnGeneID = function(ids, gl)
    {
	var resp = json_call_ajax_sync("PlantExpression.getExperimentsBySampleIDnGeneID", [ids, gl]);
//	var resp = json_call_sync("PlantExpression.getExperimentsBySampleIDnGeneID", [ids, gl]);
        return resp[0];
    }

    this.getExperimentsBySampleIDnGeneID_async = function(ids, gl, _callback, _error_callback)
    {
	json_call_ajax_async("PlantExpression.getExperimentsBySampleIDnGeneID", [ids, gl], 1, _callback, _error_callback)
    }

    this.getEOSampleIDList = function(lst)
    {
	var resp = json_call_ajax_sync("PlantExpression.getEOSampleIDList", [lst]);
//	var resp = json_call_sync("PlantExpression.getEOSampleIDList", [lst]);
        return resp[0];
    }

    this.getEOSampleIDList_async = function(lst, _callback, _error_callback)
    {
	json_call_ajax_async("PlantExpression.getEOSampleIDList", [lst], 1, _callback, _error_callback)
    }

    this.getPOSampleIDList = function(lst)
    {
	var resp = json_call_ajax_sync("PlantExpression.getPOSampleIDList", [lst]);
//	var resp = json_call_sync("PlantExpression.getPOSampleIDList", [lst]);
        return resp[0];
    }

    this.getPOSampleIDList_async = function(lst, _callback, _error_callback)
    {
	json_call_ajax_async("PlantExpression.getPOSampleIDList", [lst], 1, _callback, _error_callback)
    }

    this.getAllPO = function()
    {
	var resp = json_call_ajax_sync("PlantExpression.getAllPO", []);
//	var resp = json_call_sync("PlantExpression.getAllPO", []);
        return resp[0];
    }

    this.getAllPO_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("PlantExpression.getAllPO", [], 1, _callback, _error_callback)
    }

    this.getAllEO = function()
    {
	var resp = json_call_ajax_sync("PlantExpression.getAllEO", []);
//	var resp = json_call_sync("PlantExpression.getAllEO", []);
        return resp[0];
    }

    this.getAllEO_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("PlantExpression.getAllEO", [], 1, _callback, _error_callback)
    }

    this.getPODescriptions = function(ids)
    {
	var resp = json_call_ajax_sync("PlantExpression.getPODescriptions", [ids]);
//	var resp = json_call_sync("PlantExpression.getPODescriptions", [ids]);
        return resp[0];
    }

    this.getPODescriptions_async = function(ids, _callback, _error_callback)
    {
	json_call_ajax_async("PlantExpression.getPODescriptions", [ids], 1, _callback, _error_callback)
    }

    this.getEODescriptions = function(ids)
    {
	var resp = json_call_ajax_sync("PlantExpression.getEODescriptions", [ids]);
//	var resp = json_call_sync("PlantExpression.getEODescriptions", [ids]);
        return resp[0];
    }

    this.getEODescriptions_async = function(ids, _callback, _error_callback)
    {
	json_call_ajax_async("PlantExpression.getEODescriptions", [ids], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function ProteinInfo(url) {

    var _url = url;


    this.fids_to_operons = function(fids)
    {
	var resp = json_call_ajax_sync("ProteinInfo.fids_to_operons", [fids]);
//	var resp = json_call_sync("ProteinInfo.fids_to_operons", [fids]);
        return resp[0];
    }

    this.fids_to_operons_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("ProteinInfo.fids_to_operons", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_domains = function(fids)
    {
	var resp = json_call_ajax_sync("ProteinInfo.fids_to_domains", [fids]);
//	var resp = json_call_sync("ProteinInfo.fids_to_domains", [fids]);
        return resp[0];
    }

    this.fids_to_domains_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("ProteinInfo.fids_to_domains", [fids], 1, _callback, _error_callback)
    }

    this.domains_to_fids = function(domain_ids)
    {
	var resp = json_call_ajax_sync("ProteinInfo.domains_to_fids", [domain_ids]);
//	var resp = json_call_sync("ProteinInfo.domains_to_fids", [domain_ids]);
        return resp[0];
    }

    this.domains_to_fids_async = function(domain_ids, _callback, _error_callback)
    {
	json_call_ajax_async("ProteinInfo.domains_to_fids", [domain_ids], 1, _callback, _error_callback)
    }

    this.fids_to_ipr = function(fids)
    {
	var resp = json_call_ajax_sync("ProteinInfo.fids_to_ipr", [fids]);
//	var resp = json_call_sync("ProteinInfo.fids_to_ipr", [fids]);
        return resp[0];
    }

    this.fids_to_ipr_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("ProteinInfo.fids_to_ipr", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_orthologs = function(fids)
    {
	var resp = json_call_ajax_sync("ProteinInfo.fids_to_orthologs", [fids]);
//	var resp = json_call_sync("ProteinInfo.fids_to_orthologs", [fids]);
        return resp[0];
    }

    this.fids_to_orthologs_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("ProteinInfo.fids_to_orthologs", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_ec = function(fids)
    {
	var resp = json_call_ajax_sync("ProteinInfo.fids_to_ec", [fids]);
//	var resp = json_call_sync("ProteinInfo.fids_to_ec", [fids]);
        return resp[0];
    }

    this.fids_to_ec_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("ProteinInfo.fids_to_ec", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_go = function(fids)
    {
	var resp = json_call_ajax_sync("ProteinInfo.fids_to_go", [fids]);
//	var resp = json_call_sync("ProteinInfo.fids_to_go", [fids]);
        return resp[0];
    }

    this.fids_to_go_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("ProteinInfo.fids_to_go", [fids], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function FileType(url) {

    var _url = url;


    this.get_file_type = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_file_type", [id]);
//	var resp = json_call_sync("FileType.get_file_type", [id]);
        return resp[0];
    }

    this.get_file_type_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_file_type", [id], 1, _callback, _error_callback)
    }

    this.get_this_file_type_only = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_this_file_type_only", [id]);
//	var resp = json_call_sync("FileType.get_this_file_type_only", [id]);
        return resp[0];
    }

    this.get_this_file_type_only_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_this_file_type_only", [id], 1, _callback, _error_callback)
    }

    this.get_file_type_name = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_file_type_name", [id]);
//	var resp = json_call_sync("FileType.get_file_type_name", [id]);
        return resp[0];
    }

    this.get_file_type_name_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_file_type_name", [id], 1, _callback, _error_callback)
    }

    this.get_file_type_names = function(ids)
    {
	var resp = json_call_ajax_sync("FileType.get_file_type_names", [ids]);
//	var resp = json_call_sync("FileType.get_file_type_names", [ids]);
        return resp[0];
    }

    this.get_file_type_names_async = function(ids, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_file_type_names", [ids], 1, _callback, _error_callback)
    }

    this.get_default_extension = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_default_extension", [id]);
//	var resp = json_call_sync("FileType.get_default_extension", [id]);
        return resp[0];
    }

    this.get_default_extension_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_default_extension", [id], 1, _callback, _error_callback)
    }

    this.get_default_extensions = function(ids)
    {
	var resp = json_call_ajax_sync("FileType.get_default_extensions", [ids]);
//	var resp = json_call_sync("FileType.get_default_extensions", [ids]);
        return resp[0];
    }

    this.get_default_extensions_async = function(ids, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_default_extensions", [ids], 1, _callback, _error_callback)
    }

    this.get_file_type_property = function(id, key)
    {
	var resp = json_call_ajax_sync("FileType.get_file_type_property", [id, key]);
//	var resp = json_call_sync("FileType.get_file_type_property", [id, key]);
        return resp[0];
    }

    this.get_file_type_property_async = function(id, key, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_file_type_property", [id, key], 1, _callback, _error_callback)
    }

    this.get_file_type_id_by_full_name = function(name)
    {
	var resp = json_call_ajax_sync("FileType.get_file_type_id_by_full_name", [name]);
//	var resp = json_call_sync("FileType.get_file_type_id_by_full_name", [name]);
        return resp[0];
    }

    this.get_file_type_id_by_full_name_async = function(name, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_file_type_id_by_full_name", [name], 1, _callback, _error_callback)
    }

    this.get_possible_file_type_by_extension = function(extension)
    {
	var resp = json_call_ajax_sync("FileType.get_possible_file_type_by_extension", [extension]);
//	var resp = json_call_sync("FileType.get_possible_file_type_by_extension", [extension]);
        return resp[0];
    }

    this.get_possible_file_type_by_extension_async = function(extension, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_possible_file_type_by_extension", [extension], 1, _callback, _error_callback)
    }

    this.get_possible_file_type_by_default_extension = function(extension)
    {
	var resp = json_call_ajax_sync("FileType.get_possible_file_type_by_default_extension", [extension]);
//	var resp = json_call_sync("FileType.get_possible_file_type_by_default_extension", [extension]);
        return resp[0];
    }

    this.get_possible_file_type_by_default_extension_async = function(extension, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_possible_file_type_by_default_extension", [extension], 1, _callback, _error_callback)
    }

    this.get_parent = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_parent", [id]);
//	var resp = json_call_sync("FileType.get_parent", [id]);
        return resp[0];
    }

    this.get_parent_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_parent", [id], 1, _callback, _error_callback)
    }

    this.get_all_children = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_all_children", [id]);
//	var resp = json_call_sync("FileType.get_all_children", [id]);
        return resp[0];
    }

    this.get_all_children_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_all_children", [id], 1, _callback, _error_callback)
    }

    this.get_ancestry = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_ancestry", [id]);
//	var resp = json_call_sync("FileType.get_ancestry", [id]);
        return resp[0];
    }

    this.get_ancestry_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_ancestry", [id], 1, _callback, _error_callback)
    }

    this.get_all_descendants = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_all_descendants", [id]);
//	var resp = json_call_sync("FileType.get_all_descendants", [id]);
        return resp[0];
    }

    this.get_all_descendants_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_all_descendants", [id], 1, _callback, _error_callback)
    }

    this.dump_file_type_hierarchy_in_newick = function()
    {
	var resp = json_call_ajax_sync("FileType.dump_file_type_hierarchy_in_newick", []);
//	var resp = json_call_sync("FileType.dump_file_type_hierarchy_in_newick", []);
        return resp[0];
    }

    this.dump_file_type_hierarchy_in_newick_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("FileType.dump_file_type_hierarchy_in_newick", [], 1, _callback, _error_callback)
    }

    this.dump_file_type_hierarchy_pretty = function()
    {
	var resp = json_call_ajax_sync("FileType.dump_file_type_hierarchy_pretty", []);
//	var resp = json_call_sync("FileType.dump_file_type_hierarchy_pretty", []);
        return resp[0];
    }

    this.dump_file_type_hierarchy_pretty_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("FileType.dump_file_type_hierarchy_pretty", [], 1, _callback, _error_callback)
    }

    this.all_file_type_ids = function()
    {
	var resp = json_call_ajax_sync("FileType.all_file_type_ids", []);
//	var resp = json_call_sync("FileType.all_file_type_ids", []);
        return resp[0];
    }

    this.all_file_type_ids_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("FileType.all_file_type_ids", [], 1, _callback, _error_callback)
    }

    this.all_file_type_property = function(propertyName)
    {
	var resp = json_call_ajax_sync("FileType.all_file_type_property", [propertyName]);
//	var resp = json_call_sync("FileType.all_file_type_property", [propertyName]);
        return resp[0];
    }

    this.all_file_type_property_async = function(propertyName, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.all_file_type_property", [propertyName], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function Ontology(url) {

    var _url = url;


    this.getGOIDList = function(sname, geneIDList, domainList, ecList)
    {
	var resp = json_call_ajax_sync("Ontology.getGOIDList", [sname, geneIDList, domainList, ecList]);
//	var resp = json_call_sync("Ontology.getGOIDList", [sname, geneIDList, domainList, ecList]);
        return resp[0];
    }

    this.getGOIDList_async = function(sname, geneIDList, domainList, ecList, _callback, _error_callback)
    {
	json_call_ajax_async("Ontology.getGOIDList", [sname, geneIDList, domainList, ecList], 1, _callback, _error_callback)
    }

    this.getGoDesc = function(goIDList)
    {
	var resp = json_call_ajax_sync("Ontology.getGoDesc", [goIDList]);
//	var resp = json_call_sync("Ontology.getGoDesc", [goIDList]);
        return resp[0];
    }

    this.getGoDesc_async = function(goIDList, _callback, _error_callback)
    {
	json_call_ajax_async("Ontology.getGoDesc", [goIDList], 1, _callback, _error_callback)
    }

    this.getGOEnrichment = function(sname, geneIDList, domainList, ecList, type)
    {
	var resp = json_call_ajax_sync("Ontology.getGOEnrichment", [sname, geneIDList, domainList, ecList, type]);
//	var resp = json_call_sync("Ontology.getGOEnrichment", [sname, geneIDList, domainList, ecList, type]);
        return resp[0];
    }

    this.getGOEnrichment_async = function(sname, geneIDList, domainList, ecList, type, _callback, _error_callback)
    {
	json_call_ajax_async("Ontology.getGOEnrichment", [sname, geneIDList, domainList, ecList, type], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function FileType(url) {

    var _url = url;


    this.get_file_type = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_file_type", [id]);
//	var resp = json_call_sync("FileType.get_file_type", [id]);
        return resp[0];
    }

    this.get_file_type_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_file_type", [id], 1, _callback, _error_callback)
    }

    this.get_this_file_type_only = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_this_file_type_only", [id]);
//	var resp = json_call_sync("FileType.get_this_file_type_only", [id]);
        return resp[0];
    }

    this.get_this_file_type_only_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_this_file_type_only", [id], 1, _callback, _error_callback)
    }

    this.get_file_type_name = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_file_type_name", [id]);
//	var resp = json_call_sync("FileType.get_file_type_name", [id]);
        return resp[0];
    }

    this.get_file_type_name_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_file_type_name", [id], 1, _callback, _error_callback)
    }

    this.get_file_type_names = function(ids)
    {
	var resp = json_call_ajax_sync("FileType.get_file_type_names", [ids]);
//	var resp = json_call_sync("FileType.get_file_type_names", [ids]);
        return resp[0];
    }

    this.get_file_type_names_async = function(ids, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_file_type_names", [ids], 1, _callback, _error_callback)
    }

    this.get_default_extension = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_default_extension", [id]);
//	var resp = json_call_sync("FileType.get_default_extension", [id]);
        return resp[0];
    }

    this.get_default_extension_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_default_extension", [id], 1, _callback, _error_callback)
    }

    this.get_default_extensions = function(ids)
    {
	var resp = json_call_ajax_sync("FileType.get_default_extensions", [ids]);
//	var resp = json_call_sync("FileType.get_default_extensions", [ids]);
        return resp[0];
    }

    this.get_default_extensions_async = function(ids, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_default_extensions", [ids], 1, _callback, _error_callback)
    }

    this.get_file_type_property = function(id, key)
    {
	var resp = json_call_ajax_sync("FileType.get_file_type_property", [id, key]);
//	var resp = json_call_sync("FileType.get_file_type_property", [id, key]);
        return resp[0];
    }

    this.get_file_type_property_async = function(id, key, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_file_type_property", [id, key], 1, _callback, _error_callback)
    }

    this.get_file_type_id_by_full_name = function(name)
    {
	var resp = json_call_ajax_sync("FileType.get_file_type_id_by_full_name", [name]);
//	var resp = json_call_sync("FileType.get_file_type_id_by_full_name", [name]);
        return resp[0];
    }

    this.get_file_type_id_by_full_name_async = function(name, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_file_type_id_by_full_name", [name], 1, _callback, _error_callback)
    }

    this.get_possible_file_type_by_extension = function(extension)
    {
	var resp = json_call_ajax_sync("FileType.get_possible_file_type_by_extension", [extension]);
//	var resp = json_call_sync("FileType.get_possible_file_type_by_extension", [extension]);
        return resp[0];
    }

    this.get_possible_file_type_by_extension_async = function(extension, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_possible_file_type_by_extension", [extension], 1, _callback, _error_callback)
    }

    this.get_possible_file_type_by_default_extension = function(extension)
    {
	var resp = json_call_ajax_sync("FileType.get_possible_file_type_by_default_extension", [extension]);
//	var resp = json_call_sync("FileType.get_possible_file_type_by_default_extension", [extension]);
        return resp[0];
    }

    this.get_possible_file_type_by_default_extension_async = function(extension, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_possible_file_type_by_default_extension", [extension], 1, _callback, _error_callback)
    }

    this.get_parent = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_parent", [id]);
//	var resp = json_call_sync("FileType.get_parent", [id]);
        return resp[0];
    }

    this.get_parent_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_parent", [id], 1, _callback, _error_callback)
    }

    this.get_all_children = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_all_children", [id]);
//	var resp = json_call_sync("FileType.get_all_children", [id]);
        return resp[0];
    }

    this.get_all_children_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_all_children", [id], 1, _callback, _error_callback)
    }

    this.get_ancestry = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_ancestry", [id]);
//	var resp = json_call_sync("FileType.get_ancestry", [id]);
        return resp[0];
    }

    this.get_ancestry_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_ancestry", [id], 1, _callback, _error_callback)
    }

    this.get_all_descendants = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_all_descendants", [id]);
//	var resp = json_call_sync("FileType.get_all_descendants", [id]);
        return resp[0];
    }

    this.get_all_descendants_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_all_descendants", [id], 1, _callback, _error_callback)
    }

    this.dump_file_type_hierarchy_in_newick = function()
    {
	var resp = json_call_ajax_sync("FileType.dump_file_type_hierarchy_in_newick", []);
//	var resp = json_call_sync("FileType.dump_file_type_hierarchy_in_newick", []);
        return resp[0];
    }

    this.dump_file_type_hierarchy_in_newick_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("FileType.dump_file_type_hierarchy_in_newick", [], 1, _callback, _error_callback)
    }

    this.dump_file_type_hierarchy_pretty = function()
    {
	var resp = json_call_ajax_sync("FileType.dump_file_type_hierarchy_pretty", []);
//	var resp = json_call_sync("FileType.dump_file_type_hierarchy_pretty", []);
        return resp[0];
    }

    this.dump_file_type_hierarchy_pretty_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("FileType.dump_file_type_hierarchy_pretty", [], 1, _callback, _error_callback)
    }

    this.all_file_type_ids = function()
    {
	var resp = json_call_ajax_sync("FileType.all_file_type_ids", []);
//	var resp = json_call_sync("FileType.all_file_type_ids", []);
        return resp[0];
    }

    this.all_file_type_ids_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("FileType.all_file_type_ids", [], 1, _callback, _error_callback)
    }

    this.all_file_type_property = function(propertyName)
    {
	var resp = json_call_ajax_sync("FileType.all_file_type_property", [propertyName]);
//	var resp = json_call_sync("FileType.all_file_type_property", [propertyName]);
        return resp[0];
    }

    this.all_file_type_property_async = function(propertyName, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.all_file_type_property", [propertyName], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function workspaceService(url) {

    var _url = url;


    this.save_object = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.save_object", [params]);
//	var resp = json_call_sync("workspaceService.save_object", [params]);
        return resp[0];
    }

    this.save_object_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.save_object", [params], 1, _callback, _error_callback)
    }

    this.delete_object = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.delete_object", [params]);
//	var resp = json_call_sync("workspaceService.delete_object", [params]);
        return resp[0];
    }

    this.delete_object_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.delete_object", [params], 1, _callback, _error_callback)
    }

    this.delete_object_permanently = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.delete_object_permanently", [params]);
//	var resp = json_call_sync("workspaceService.delete_object_permanently", [params]);
        return resp[0];
    }

    this.delete_object_permanently_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.delete_object_permanently", [params], 1, _callback, _error_callback)
    }

    this.get_object = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.get_object", [params]);
//	var resp = json_call_sync("workspaceService.get_object", [params]);
        return resp[0];
    }

    this.get_object_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_object", [params], 1, _callback, _error_callback)
    }

    this.get_objectmeta = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.get_objectmeta", [params]);
//	var resp = json_call_sync("workspaceService.get_objectmeta", [params]);
        return resp[0];
    }

    this.get_objectmeta_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_objectmeta", [params], 1, _callback, _error_callback)
    }

    this.revert_object = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.revert_object", [params]);
//	var resp = json_call_sync("workspaceService.revert_object", [params]);
        return resp[0];
    }

    this.revert_object_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.revert_object", [params], 1, _callback, _error_callback)
    }

    this.copy_object = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.copy_object", [params]);
//	var resp = json_call_sync("workspaceService.copy_object", [params]);
        return resp[0];
    }

    this.copy_object_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.copy_object", [params], 1, _callback, _error_callback)
    }

    this.move_object = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.move_object", [params]);
//	var resp = json_call_sync("workspaceService.move_object", [params]);
        return resp[0];
    }

    this.move_object_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.move_object", [params], 1, _callback, _error_callback)
    }

    this.has_object = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.has_object", [params]);
//	var resp = json_call_sync("workspaceService.has_object", [params]);
        return resp[0];
    }

    this.has_object_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.has_object", [params], 1, _callback, _error_callback)
    }

    this.object_history = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.object_history", [params]);
//	var resp = json_call_sync("workspaceService.object_history", [params]);
        return resp[0];
    }

    this.object_history_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.object_history", [params], 1, _callback, _error_callback)
    }

    this.create_workspace = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.create_workspace", [params]);
//	var resp = json_call_sync("workspaceService.create_workspace", [params]);
        return resp[0];
    }

    this.create_workspace_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.create_workspace", [params], 1, _callback, _error_callback)
    }

    this.get_workspacemeta = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.get_workspacemeta", [params]);
//	var resp = json_call_sync("workspaceService.get_workspacemeta", [params]);
        return resp[0];
    }

    this.get_workspacemeta_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_workspacemeta", [params], 1, _callback, _error_callback)
    }

    this.get_workspacepermissions = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.get_workspacepermissions", [params]);
//	var resp = json_call_sync("workspaceService.get_workspacepermissions", [params]);
        return resp[0];
    }

    this.get_workspacepermissions_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_workspacepermissions", [params], 1, _callback, _error_callback)
    }

    this.delete_workspace = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.delete_workspace", [params]);
//	var resp = json_call_sync("workspaceService.delete_workspace", [params]);
        return resp[0];
    }

    this.delete_workspace_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.delete_workspace", [params], 1, _callback, _error_callback)
    }

    this.clone_workspace = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.clone_workspace", [params]);
//	var resp = json_call_sync("workspaceService.clone_workspace", [params]);
        return resp[0];
    }

    this.clone_workspace_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.clone_workspace", [params], 1, _callback, _error_callback)
    }

    this.list_workspaces = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.list_workspaces", [params]);
//	var resp = json_call_sync("workspaceService.list_workspaces", [params]);
        return resp[0];
    }

    this.list_workspaces_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.list_workspaces", [params], 1, _callback, _error_callback)
    }

    this.list_workspace_objects = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.list_workspace_objects", [params]);
//	var resp = json_call_sync("workspaceService.list_workspace_objects", [params]);
        return resp[0];
    }

    this.list_workspace_objects_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.list_workspace_objects", [params], 1, _callback, _error_callback)
    }

    this.set_global_workspace_permissions = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.set_global_workspace_permissions", [params]);
//	var resp = json_call_sync("workspaceService.set_global_workspace_permissions", [params]);
        return resp[0];
    }

    this.set_global_workspace_permissions_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.set_global_workspace_permissions", [params], 1, _callback, _error_callback)
    }

    this.set_workspace_permissions = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.set_workspace_permissions", [params]);
//	var resp = json_call_sync("workspaceService.set_workspace_permissions", [params]);
        return resp[0];
    }

    this.set_workspace_permissions_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.set_workspace_permissions", [params], 1, _callback, _error_callback)
    }

    this.get_user_settings = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.get_user_settings", [params]);
//	var resp = json_call_sync("workspaceService.get_user_settings", [params]);
        return resp[0];
    }

    this.get_user_settings_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_user_settings", [params], 1, _callback, _error_callback)
    }

    this.set_user_settings = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.set_user_settings", [params]);
//	var resp = json_call_sync("workspaceService.set_user_settings", [params]);
        return resp[0];
    }

    this.set_user_settings_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.set_user_settings", [params], 1, _callback, _error_callback)
    }

    this.queue_job = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.queue_job", [params]);
//	var resp = json_call_sync("workspaceService.queue_job", [params]);
        return resp[0];
    }

    this.queue_job_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.queue_job", [params], 1, _callback, _error_callback)
    }

    this.set_job_status = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.set_job_status", [params]);
//	var resp = json_call_sync("workspaceService.set_job_status", [params]);
        return resp[0];
    }

    this.set_job_status_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.set_job_status", [params], 1, _callback, _error_callback)
    }

    this.get_jobs = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.get_jobs", [params]);
//	var resp = json_call_sync("workspaceService.get_jobs", [params]);
        return resp[0];
    }

    this.get_jobs_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_jobs", [params], 1, _callback, _error_callback)
    }

    this.get_types = function()
    {
	var resp = json_call_ajax_sync("workspaceService.get_types", []);
//	var resp = json_call_sync("workspaceService.get_types", []);
        return resp[0];
    }

    this.get_types_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_types", [], 1, _callback, _error_callback)
    }

    this.add_type = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.add_type", [params]);
//	var resp = json_call_sync("workspaceService.add_type", [params]);
        return resp[0];
    }

    this.add_type_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.add_type", [params], 1, _callback, _error_callback)
    }

    this.remove_type = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.remove_type", [params]);
//	var resp = json_call_sync("workspaceService.remove_type", [params]);
        return resp[0];
    }

    this.remove_type_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.remove_type", [params], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function Tree(url) {

    var _url = url;


    this.replace_node_names = function(tree, replacements)
    {
	var resp = json_call_ajax_sync("Tree.replace_node_names", [tree, replacements]);
//	var resp = json_call_sync("Tree.replace_node_names", [tree, replacements]);
        return resp[0];
    }

    this.replace_node_names_async = function(tree, replacements, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.replace_node_names", [tree, replacements], 1, _callback, _error_callback)
    }

    this.remove_node_names_and_simplify = function(tree, removal_list)
    {
	var resp = json_call_ajax_sync("Tree.remove_node_names_and_simplify", [tree, removal_list]);
//	var resp = json_call_sync("Tree.remove_node_names_and_simplify", [tree, removal_list]);
        return resp[0];
    }

    this.remove_node_names_and_simplify_async = function(tree, removal_list, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.remove_node_names_and_simplify", [tree, removal_list], 1, _callback, _error_callback)
    }

    this.extract_leaf_node_names = function(tree)
    {
	var resp = json_call_ajax_sync("Tree.extract_leaf_node_names", [tree]);
//	var resp = json_call_sync("Tree.extract_leaf_node_names", [tree]);
        return resp[0];
    }

    this.extract_leaf_node_names_async = function(tree, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.extract_leaf_node_names", [tree], 1, _callback, _error_callback)
    }

    this.extract_node_names = function(tree)
    {
	var resp = json_call_ajax_sync("Tree.extract_node_names", [tree]);
//	var resp = json_call_sync("Tree.extract_node_names", [tree]);
        return resp[0];
    }

    this.extract_node_names_async = function(tree, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.extract_node_names", [tree], 1, _callback, _error_callback)
    }

    this.get_node_count = function(tree)
    {
	var resp = json_call_ajax_sync("Tree.get_node_count", [tree]);
//	var resp = json_call_sync("Tree.get_node_count", [tree]);
        return resp[0];
    }

    this.get_node_count_async = function(tree, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.get_node_count", [tree], 1, _callback, _error_callback)
    }

    this.get_leaf_count = function(tree)
    {
	var resp = json_call_ajax_sync("Tree.get_leaf_count", [tree]);
//	var resp = json_call_sync("Tree.get_leaf_count", [tree]);
        return resp[0];
    }

    this.get_leaf_count_async = function(tree, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.get_leaf_count", [tree], 1, _callback, _error_callback)
    }

    this.get_tree = function(tree_id, options)
    {
	var resp = json_call_ajax_sync("Tree.get_tree", [tree_id, options]);
//	var resp = json_call_sync("Tree.get_tree", [tree_id, options]);
        return resp[0];
    }

    this.get_tree_async = function(tree_id, options, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.get_tree", [tree_id, options], 1, _callback, _error_callback)
    }

    this.get_tree_data = function(tree_ids)
    {
	var resp = json_call_ajax_sync("Tree.get_tree_data", [tree_ids]);
//	var resp = json_call_sync("Tree.get_tree_data", [tree_ids]);
        return resp[0];
    }

    this.get_tree_data_async = function(tree_ids, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.get_tree_data", [tree_ids], 1, _callback, _error_callback)
    }

    this.get_alignment_data = function(alignment_ids)
    {
	var resp = json_call_ajax_sync("Tree.get_alignment_data", [alignment_ids]);
//	var resp = json_call_sync("Tree.get_alignment_data", [alignment_ids]);
        return resp[0];
    }

    this.get_alignment_data_async = function(alignment_ids, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.get_alignment_data", [alignment_ids], 1, _callback, _error_callback)
    }

    this.get_tree_ids_by_feature = function(feature_ids)
    {
	var resp = json_call_ajax_sync("Tree.get_tree_ids_by_feature", [feature_ids]);
//	var resp = json_call_sync("Tree.get_tree_ids_by_feature", [feature_ids]);
        return resp[0];
    }

    this.get_tree_ids_by_feature_async = function(feature_ids, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.get_tree_ids_by_feature", [feature_ids], 1, _callback, _error_callback)
    }

    this.get_tree_ids_by_protein_sequence = function(protein_sequence_ids)
    {
	var resp = json_call_ajax_sync("Tree.get_tree_ids_by_protein_sequence", [protein_sequence_ids]);
//	var resp = json_call_sync("Tree.get_tree_ids_by_protein_sequence", [protein_sequence_ids]);
        return resp[0];
    }

    this.get_tree_ids_by_protein_sequence_async = function(protein_sequence_ids, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.get_tree_ids_by_protein_sequence", [protein_sequence_ids], 1, _callback, _error_callback)
    }

    this.get_alignment_ids_by_feature = function(feature_ids)
    {
	var resp = json_call_ajax_sync("Tree.get_alignment_ids_by_feature", [feature_ids]);
//	var resp = json_call_sync("Tree.get_alignment_ids_by_feature", [feature_ids]);
        return resp[0];
    }

    this.get_alignment_ids_by_feature_async = function(feature_ids, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.get_alignment_ids_by_feature", [feature_ids], 1, _callback, _error_callback)
    }

    this.get_alignment_ids_by_protein_sequence = function(protein_sequence_ids)
    {
	var resp = json_call_ajax_sync("Tree.get_alignment_ids_by_protein_sequence", [protein_sequence_ids]);
//	var resp = json_call_sync("Tree.get_alignment_ids_by_protein_sequence", [protein_sequence_ids]);
        return resp[0];
    }

    this.get_alignment_ids_by_protein_sequence_async = function(protein_sequence_ids, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.get_alignment_ids_by_protein_sequence", [protein_sequence_ids], 1, _callback, _error_callback)
    }

    this.draw_html_tree = function(tree, display_options)
    {
	var resp = json_call_ajax_sync("Tree.draw_html_tree", [tree, display_options]);
//	var resp = json_call_sync("Tree.draw_html_tree", [tree, display_options]);
        return resp[0];
    }

    this.draw_html_tree_async = function(tree, display_options, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.draw_html_tree", [tree, display_options], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function fbaModelServices(url) {

    var _url = url;


    this.get_models = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_models", [input]);
//	var resp = json_call_sync("fbaModelServices.get_models", [input]);
        return resp[0];
    }

    this.get_models_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_models", [input], 1, _callback, _error_callback)
    }

    this.get_fbas = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_fbas", [input]);
//	var resp = json_call_sync("fbaModelServices.get_fbas", [input]);
        return resp[0];
    }

    this.get_fbas_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_fbas", [input], 1, _callback, _error_callback)
    }

    this.get_gapfills = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_gapfills", [input]);
//	var resp = json_call_sync("fbaModelServices.get_gapfills", [input]);
        return resp[0];
    }

    this.get_gapfills_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_gapfills", [input], 1, _callback, _error_callback)
    }

    this.get_gapgens = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_gapgens", [input]);
//	var resp = json_call_sync("fbaModelServices.get_gapgens", [input]);
        return resp[0];
    }

    this.get_gapgens_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_gapgens", [input], 1, _callback, _error_callback)
    }

    this.get_reactions = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_reactions", [input]);
//	var resp = json_call_sync("fbaModelServices.get_reactions", [input]);
        return resp[0];
    }

    this.get_reactions_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_reactions", [input], 1, _callback, _error_callback)
    }

    this.get_compounds = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_compounds", [input]);
//	var resp = json_call_sync("fbaModelServices.get_compounds", [input]);
        return resp[0];
    }

    this.get_compounds_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_compounds", [input], 1, _callback, _error_callback)
    }

    this.get_media = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_media", [input]);
//	var resp = json_call_sync("fbaModelServices.get_media", [input]);
        return resp[0];
    }

    this.get_media_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_media", [input], 1, _callback, _error_callback)
    }

    this.get_biochemistry = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_biochemistry", [input]);
//	var resp = json_call_sync("fbaModelServices.get_biochemistry", [input]);
        return resp[0];
    }

    this.get_biochemistry_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_biochemistry", [input], 1, _callback, _error_callback)
    }

    this.genome_object_to_workspace = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.genome_object_to_workspace", [input]);
//	var resp = json_call_sync("fbaModelServices.genome_object_to_workspace", [input]);
        return resp[0];
    }

    this.genome_object_to_workspace_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.genome_object_to_workspace", [input], 1, _callback, _error_callback)
    }

    this.genome_to_workspace = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.genome_to_workspace", [input]);
//	var resp = json_call_sync("fbaModelServices.genome_to_workspace", [input]);
        return resp[0];
    }

    this.genome_to_workspace_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.genome_to_workspace", [input], 1, _callback, _error_callback)
    }

    this.add_feature_translation = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.add_feature_translation", [input]);
//	var resp = json_call_sync("fbaModelServices.add_feature_translation", [input]);
        return resp[0];
    }

    this.add_feature_translation_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.add_feature_translation", [input], 1, _callback, _error_callback)
    }

    this.genome_to_fbamodel = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.genome_to_fbamodel", [input]);
//	var resp = json_call_sync("fbaModelServices.genome_to_fbamodel", [input]);
        return resp[0];
    }

    this.genome_to_fbamodel_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.genome_to_fbamodel", [input], 1, _callback, _error_callback)
    }

    this.export_fbamodel = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.export_fbamodel", [input]);
//	var resp = json_call_sync("fbaModelServices.export_fbamodel", [input]);
        return resp[0];
    }

    this.export_fbamodel_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.export_fbamodel", [input], 1, _callback, _error_callback)
    }

    this.adjust_model_reaction = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.adjust_model_reaction", [input]);
//	var resp = json_call_sync("fbaModelServices.adjust_model_reaction", [input]);
        return resp[0];
    }

    this.adjust_model_reaction_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.adjust_model_reaction", [input], 1, _callback, _error_callback)
    }

    this.adjust_biomass_reaction = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.adjust_biomass_reaction", [input]);
//	var resp = json_call_sync("fbaModelServices.adjust_biomass_reaction", [input]);
        return resp[0];
    }

    this.adjust_biomass_reaction_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.adjust_biomass_reaction", [input], 1, _callback, _error_callback)
    }

    this.addmedia = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.addmedia", [input]);
//	var resp = json_call_sync("fbaModelServices.addmedia", [input]);
        return resp[0];
    }

    this.addmedia_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.addmedia", [input], 1, _callback, _error_callback)
    }

    this.export_media = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.export_media", [input]);
//	var resp = json_call_sync("fbaModelServices.export_media", [input]);
        return resp[0];
    }

    this.export_media_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.export_media", [input], 1, _callback, _error_callback)
    }

    this.runfba = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.runfba", [input]);
//	var resp = json_call_sync("fbaModelServices.runfba", [input]);
        return resp[0];
    }

    this.runfba_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.runfba", [input], 1, _callback, _error_callback)
    }

    this.export_fba = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.export_fba", [input]);
//	var resp = json_call_sync("fbaModelServices.export_fba", [input]);
        return resp[0];
    }

    this.export_fba_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.export_fba", [input], 1, _callback, _error_callback)
    }

    this.import_phenotypes = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.import_phenotypes", [input]);
//	var resp = json_call_sync("fbaModelServices.import_phenotypes", [input]);
        return resp[0];
    }

    this.import_phenotypes_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.import_phenotypes", [input], 1, _callback, _error_callback)
    }

    this.simulate_phenotypes = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.simulate_phenotypes", [input]);
//	var resp = json_call_sync("fbaModelServices.simulate_phenotypes", [input]);
        return resp[0];
    }

    this.simulate_phenotypes_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.simulate_phenotypes", [input], 1, _callback, _error_callback)
    }

    this.export_phenotypeSimulationSet = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.export_phenotypeSimulationSet", [input]);
//	var resp = json_call_sync("fbaModelServices.export_phenotypeSimulationSet", [input]);
        return resp[0];
    }

    this.export_phenotypeSimulationSet_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.export_phenotypeSimulationSet", [input], 1, _callback, _error_callback)
    }

    this.integrate_reconciliation_solutions = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.integrate_reconciliation_solutions", [input]);
//	var resp = json_call_sync("fbaModelServices.integrate_reconciliation_solutions", [input]);
        return resp[0];
    }

    this.integrate_reconciliation_solutions_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.integrate_reconciliation_solutions", [input], 1, _callback, _error_callback)
    }

    this.queue_runfba = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.queue_runfba", [input]);
//	var resp = json_call_sync("fbaModelServices.queue_runfba", [input]);
        return resp[0];
    }

    this.queue_runfba_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.queue_runfba", [input], 1, _callback, _error_callback)
    }

    this.queue_gapfill_model = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.queue_gapfill_model", [input]);
//	var resp = json_call_sync("fbaModelServices.queue_gapfill_model", [input]);
        return resp[0];
    }

    this.queue_gapfill_model_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.queue_gapfill_model", [input], 1, _callback, _error_callback)
    }

    this.queue_gapgen_model = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.queue_gapgen_model", [input]);
//	var resp = json_call_sync("fbaModelServices.queue_gapgen_model", [input]);
        return resp[0];
    }

    this.queue_gapgen_model_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.queue_gapgen_model", [input], 1, _callback, _error_callback)
    }

    this.queue_wildtype_phenotype_reconciliation = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.queue_wildtype_phenotype_reconciliation", [input]);
//	var resp = json_call_sync("fbaModelServices.queue_wildtype_phenotype_reconciliation", [input]);
        return resp[0];
    }

    this.queue_wildtype_phenotype_reconciliation_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.queue_wildtype_phenotype_reconciliation", [input], 1, _callback, _error_callback)
    }

    this.queue_reconciliation_sensitivity_analysis = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.queue_reconciliation_sensitivity_analysis", [input]);
//	var resp = json_call_sync("fbaModelServices.queue_reconciliation_sensitivity_analysis", [input]);
        return resp[0];
    }

    this.queue_reconciliation_sensitivity_analysis_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.queue_reconciliation_sensitivity_analysis", [input], 1, _callback, _error_callback)
    }

    this.queue_combine_wildtype_phenotype_reconciliation = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.queue_combine_wildtype_phenotype_reconciliation", [input]);
//	var resp = json_call_sync("fbaModelServices.queue_combine_wildtype_phenotype_reconciliation", [input]);
        return resp[0];
    }

    this.queue_combine_wildtype_phenotype_reconciliation_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.queue_combine_wildtype_phenotype_reconciliation", [input], 1, _callback, _error_callback)
    }

    this.jobs_done = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.jobs_done", [input]);
//	var resp = json_call_sync("fbaModelServices.jobs_done", [input]);
        return resp[0];
    }

    this.jobs_done_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.jobs_done", [input], 1, _callback, _error_callback)
    }

    this.check_job = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.check_job", [input]);
//	var resp = json_call_sync("fbaModelServices.check_job", [input]);
        return resp[0];
    }

    this.check_job_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.check_job", [input], 1, _callback, _error_callback)
    }

    this.run_job = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.run_job", [input]);
//	var resp = json_call_sync("fbaModelServices.run_job", [input]);
        return resp[0];
    }

    this.run_job_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.run_job", [input], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function ERDB_Service(url) {

    var _url = url;


    this.GetAll = function(objectNames, filterClause, parameters, fields, count)
    {
	var resp = json_call_ajax_sync("ERDB_Service.GetAll", [objectNames, filterClause, parameters, fields, count]);
//	var resp = json_call_sync("ERDB_Service.GetAll", [objectNames, filterClause, parameters, fields, count]);
        return resp[0];
    }

    this.GetAll_async = function(objectNames, filterClause, parameters, fields, count, _callback, _error_callback)
    {
	json_call_ajax_async("ERDB_Service.GetAll", [objectNames, filterClause, parameters, fields, count], 1, _callback, _error_callback)
    }

    this.runSQL = function(SQLstring, parameters)
    {
	var resp = json_call_ajax_sync("ERDB_Service.runSQL", [SQLstring, parameters]);
//	var resp = json_call_sync("ERDB_Service.runSQL", [SQLstring, parameters]);
        return resp[0];
    }

    this.runSQL_async = function(SQLstring, parameters, _callback, _error_callback)
    {
	json_call_ajax_async("ERDB_Service.runSQL", [SQLstring, parameters], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function CDMI_API(url) {

    var _url = url;


    this.fids_to_annotations = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_annotations", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_annotations", [fids]);
        return resp[0];
    }

    this.fids_to_annotations_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_annotations", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_functions = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_functions", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_functions", [fids]);
        return resp[0];
    }

    this.fids_to_functions_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_functions", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_literature = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_literature", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_literature", [fids]);
        return resp[0];
    }

    this.fids_to_literature_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_literature", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_protein_families = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_protein_families", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_protein_families", [fids]);
        return resp[0];
    }

    this.fids_to_protein_families_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_protein_families", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_roles = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_roles", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_roles", [fids]);
        return resp[0];
    }

    this.fids_to_roles_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_roles", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_subsystems = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_subsystems", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_subsystems", [fids]);
        return resp[0];
    }

    this.fids_to_subsystems_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_subsystems", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_co_occurring_fids = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_co_occurring_fids", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_co_occurring_fids", [fids]);
        return resp[0];
    }

    this.fids_to_co_occurring_fids_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_co_occurring_fids", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_locations = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_locations", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_locations", [fids]);
        return resp[0];
    }

    this.fids_to_locations_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_locations", [fids], 1, _callback, _error_callback)
    }

    this.locations_to_fids = function(region_of_dna_strings)
    {
	var resp = json_call_ajax_sync("CDMI_API.locations_to_fids", [region_of_dna_strings]);
//	var resp = json_call_sync("CDMI_API.locations_to_fids", [region_of_dna_strings]);
        return resp[0];
    }

    this.locations_to_fids_async = function(region_of_dna_strings, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.locations_to_fids", [region_of_dna_strings], 1, _callback, _error_callback)
    }

    this.locations_to_dna_sequences = function(locations)
    {
	var resp = json_call_ajax_sync("CDMI_API.locations_to_dna_sequences", [locations]);
//	var resp = json_call_sync("CDMI_API.locations_to_dna_sequences", [locations]);
        return resp[0];
    }

    this.locations_to_dna_sequences_async = function(locations, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.locations_to_dna_sequences", [locations], 1, _callback, _error_callback)
    }

    this.proteins_to_fids = function(proteins)
    {
	var resp = json_call_ajax_sync("CDMI_API.proteins_to_fids", [proteins]);
//	var resp = json_call_sync("CDMI_API.proteins_to_fids", [proteins]);
        return resp[0];
    }

    this.proteins_to_fids_async = function(proteins, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.proteins_to_fids", [proteins], 1, _callback, _error_callback)
    }

    this.proteins_to_protein_families = function(proteins)
    {
	var resp = json_call_ajax_sync("CDMI_API.proteins_to_protein_families", [proteins]);
//	var resp = json_call_sync("CDMI_API.proteins_to_protein_families", [proteins]);
        return resp[0];
    }

    this.proteins_to_protein_families_async = function(proteins, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.proteins_to_protein_families", [proteins], 1, _callback, _error_callback)
    }

    this.proteins_to_literature = function(proteins)
    {
	var resp = json_call_ajax_sync("CDMI_API.proteins_to_literature", [proteins]);
//	var resp = json_call_sync("CDMI_API.proteins_to_literature", [proteins]);
        return resp[0];
    }

    this.proteins_to_literature_async = function(proteins, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.proteins_to_literature", [proteins], 1, _callback, _error_callback)
    }

    this.proteins_to_functions = function(proteins)
    {
	var resp = json_call_ajax_sync("CDMI_API.proteins_to_functions", [proteins]);
//	var resp = json_call_sync("CDMI_API.proteins_to_functions", [proteins]);
        return resp[0];
    }

    this.proteins_to_functions_async = function(proteins, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.proteins_to_functions", [proteins], 1, _callback, _error_callback)
    }

    this.proteins_to_roles = function(proteins)
    {
	var resp = json_call_ajax_sync("CDMI_API.proteins_to_roles", [proteins]);
//	var resp = json_call_sync("CDMI_API.proteins_to_roles", [proteins]);
        return resp[0];
    }

    this.proteins_to_roles_async = function(proteins, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.proteins_to_roles", [proteins], 1, _callback, _error_callback)
    }

    this.roles_to_proteins = function(roles)
    {
	var resp = json_call_ajax_sync("CDMI_API.roles_to_proteins", [roles]);
//	var resp = json_call_sync("CDMI_API.roles_to_proteins", [roles]);
        return resp[0];
    }

    this.roles_to_proteins_async = function(roles, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.roles_to_proteins", [roles], 1, _callback, _error_callback)
    }

    this.roles_to_subsystems = function(roles)
    {
	var resp = json_call_ajax_sync("CDMI_API.roles_to_subsystems", [roles]);
//	var resp = json_call_sync("CDMI_API.roles_to_subsystems", [roles]);
        return resp[0];
    }

    this.roles_to_subsystems_async = function(roles, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.roles_to_subsystems", [roles], 1, _callback, _error_callback)
    }

    this.roles_to_protein_families = function(roles)
    {
	var resp = json_call_ajax_sync("CDMI_API.roles_to_protein_families", [roles]);
//	var resp = json_call_sync("CDMI_API.roles_to_protein_families", [roles]);
        return resp[0];
    }

    this.roles_to_protein_families_async = function(roles, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.roles_to_protein_families", [roles], 1, _callback, _error_callback)
    }

    this.fids_to_coexpressed_fids = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_coexpressed_fids", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_coexpressed_fids", [fids]);
        return resp[0];
    }

    this.fids_to_coexpressed_fids_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_coexpressed_fids", [fids], 1, _callback, _error_callback)
    }

    this.protein_families_to_fids = function(protein_families)
    {
	var resp = json_call_ajax_sync("CDMI_API.protein_families_to_fids", [protein_families]);
//	var resp = json_call_sync("CDMI_API.protein_families_to_fids", [protein_families]);
        return resp[0];
    }

    this.protein_families_to_fids_async = function(protein_families, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.protein_families_to_fids", [protein_families], 1, _callback, _error_callback)
    }

    this.protein_families_to_proteins = function(protein_families)
    {
	var resp = json_call_ajax_sync("CDMI_API.protein_families_to_proteins", [protein_families]);
//	var resp = json_call_sync("CDMI_API.protein_families_to_proteins", [protein_families]);
        return resp[0];
    }

    this.protein_families_to_proteins_async = function(protein_families, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.protein_families_to_proteins", [protein_families], 1, _callback, _error_callback)
    }

    this.protein_families_to_functions = function(protein_families)
    {
	var resp = json_call_ajax_sync("CDMI_API.protein_families_to_functions", [protein_families]);
//	var resp = json_call_sync("CDMI_API.protein_families_to_functions", [protein_families]);
        return resp[0];
    }

    this.protein_families_to_functions_async = function(protein_families, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.protein_families_to_functions", [protein_families], 1, _callback, _error_callback)
    }

    this.protein_families_to_co_occurring_families = function(protein_families)
    {
	var resp = json_call_ajax_sync("CDMI_API.protein_families_to_co_occurring_families", [protein_families]);
//	var resp = json_call_sync("CDMI_API.protein_families_to_co_occurring_families", [protein_families]);
        return resp[0];
    }

    this.protein_families_to_co_occurring_families_async = function(protein_families, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.protein_families_to_co_occurring_families", [protein_families], 1, _callback, _error_callback)
    }

    this.co_occurrence_evidence = function(pairs_of_fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.co_occurrence_evidence", [pairs_of_fids]);
//	var resp = json_call_sync("CDMI_API.co_occurrence_evidence", [pairs_of_fids]);
        return resp[0];
    }

    this.co_occurrence_evidence_async = function(pairs_of_fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.co_occurrence_evidence", [pairs_of_fids], 1, _callback, _error_callback)
    }

    this.contigs_to_sequences = function(contigs)
    {
	var resp = json_call_ajax_sync("CDMI_API.contigs_to_sequences", [contigs]);
//	var resp = json_call_sync("CDMI_API.contigs_to_sequences", [contigs]);
        return resp[0];
    }

    this.contigs_to_sequences_async = function(contigs, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.contigs_to_sequences", [contigs], 1, _callback, _error_callback)
    }

    this.contigs_to_lengths = function(contigs)
    {
	var resp = json_call_ajax_sync("CDMI_API.contigs_to_lengths", [contigs]);
//	var resp = json_call_sync("CDMI_API.contigs_to_lengths", [contigs]);
        return resp[0];
    }

    this.contigs_to_lengths_async = function(contigs, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.contigs_to_lengths", [contigs], 1, _callback, _error_callback)
    }

    this.contigs_to_md5s = function(contigs)
    {
	var resp = json_call_ajax_sync("CDMI_API.contigs_to_md5s", [contigs]);
//	var resp = json_call_sync("CDMI_API.contigs_to_md5s", [contigs]);
        return resp[0];
    }

    this.contigs_to_md5s_async = function(contigs, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.contigs_to_md5s", [contigs], 1, _callback, _error_callback)
    }

    this.md5s_to_genomes = function(md5s)
    {
	var resp = json_call_ajax_sync("CDMI_API.md5s_to_genomes", [md5s]);
//	var resp = json_call_sync("CDMI_API.md5s_to_genomes", [md5s]);
        return resp[0];
    }

    this.md5s_to_genomes_async = function(md5s, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.md5s_to_genomes", [md5s], 1, _callback, _error_callback)
    }

    this.genomes_to_md5s = function(genomes)
    {
	var resp = json_call_ajax_sync("CDMI_API.genomes_to_md5s", [genomes]);
//	var resp = json_call_sync("CDMI_API.genomes_to_md5s", [genomes]);
        return resp[0];
    }

    this.genomes_to_md5s_async = function(genomes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.genomes_to_md5s", [genomes], 1, _callback, _error_callback)
    }

    this.genomes_to_contigs = function(genomes)
    {
	var resp = json_call_ajax_sync("CDMI_API.genomes_to_contigs", [genomes]);
//	var resp = json_call_sync("CDMI_API.genomes_to_contigs", [genomes]);
        return resp[0];
    }

    this.genomes_to_contigs_async = function(genomes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.genomes_to_contigs", [genomes], 1, _callback, _error_callback)
    }

    this.genomes_to_fids = function(genomes, types_of_fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.genomes_to_fids", [genomes, types_of_fids]);
//	var resp = json_call_sync("CDMI_API.genomes_to_fids", [genomes, types_of_fids]);
        return resp[0];
    }

    this.genomes_to_fids_async = function(genomes, types_of_fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.genomes_to_fids", [genomes, types_of_fids], 1, _callback, _error_callback)
    }

    this.genomes_to_taxonomies = function(genomes)
    {
	var resp = json_call_ajax_sync("CDMI_API.genomes_to_taxonomies", [genomes]);
//	var resp = json_call_sync("CDMI_API.genomes_to_taxonomies", [genomes]);
        return resp[0];
    }

    this.genomes_to_taxonomies_async = function(genomes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.genomes_to_taxonomies", [genomes], 1, _callback, _error_callback)
    }

    this.genomes_to_subsystems = function(genomes)
    {
	var resp = json_call_ajax_sync("CDMI_API.genomes_to_subsystems", [genomes]);
//	var resp = json_call_sync("CDMI_API.genomes_to_subsystems", [genomes]);
        return resp[0];
    }

    this.genomes_to_subsystems_async = function(genomes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.genomes_to_subsystems", [genomes], 1, _callback, _error_callback)
    }

    this.subsystems_to_genomes = function(subsystems)
    {
	var resp = json_call_ajax_sync("CDMI_API.subsystems_to_genomes", [subsystems]);
//	var resp = json_call_sync("CDMI_API.subsystems_to_genomes", [subsystems]);
        return resp[0];
    }

    this.subsystems_to_genomes_async = function(subsystems, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.subsystems_to_genomes", [subsystems], 1, _callback, _error_callback)
    }

    this.subsystems_to_fids = function(subsystems, genomes)
    {
	var resp = json_call_ajax_sync("CDMI_API.subsystems_to_fids", [subsystems, genomes]);
//	var resp = json_call_sync("CDMI_API.subsystems_to_fids", [subsystems, genomes]);
        return resp[0];
    }

    this.subsystems_to_fids_async = function(subsystems, genomes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.subsystems_to_fids", [subsystems, genomes], 1, _callback, _error_callback)
    }

    this.subsystems_to_roles = function(subsystems, aux)
    {
	var resp = json_call_ajax_sync("CDMI_API.subsystems_to_roles", [subsystems, aux]);
//	var resp = json_call_sync("CDMI_API.subsystems_to_roles", [subsystems, aux]);
        return resp[0];
    }

    this.subsystems_to_roles_async = function(subsystems, aux, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.subsystems_to_roles", [subsystems, aux], 1, _callback, _error_callback)
    }

    this.subsystems_to_spreadsheets = function(subsystems, genomes)
    {
	var resp = json_call_ajax_sync("CDMI_API.subsystems_to_spreadsheets", [subsystems, genomes]);
//	var resp = json_call_sync("CDMI_API.subsystems_to_spreadsheets", [subsystems, genomes]);
        return resp[0];
    }

    this.subsystems_to_spreadsheets_async = function(subsystems, genomes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.subsystems_to_spreadsheets", [subsystems, genomes], 1, _callback, _error_callback)
    }

    this.all_roles_used_in_models = function()
    {
	var resp = json_call_ajax_sync("CDMI_API.all_roles_used_in_models", []);
//	var resp = json_call_sync("CDMI_API.all_roles_used_in_models", []);
        return resp[0];
    }

    this.all_roles_used_in_models_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.all_roles_used_in_models", [], 1, _callback, _error_callback)
    }

    this.complexes_to_complex_data = function(complexes)
    {
	var resp = json_call_ajax_sync("CDMI_API.complexes_to_complex_data", [complexes]);
//	var resp = json_call_sync("CDMI_API.complexes_to_complex_data", [complexes]);
        return resp[0];
    }

    this.complexes_to_complex_data_async = function(complexes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.complexes_to_complex_data", [complexes], 1, _callback, _error_callback)
    }

    this.genomes_to_genome_data = function(genomes)
    {
	var resp = json_call_ajax_sync("CDMI_API.genomes_to_genome_data", [genomes]);
//	var resp = json_call_sync("CDMI_API.genomes_to_genome_data", [genomes]);
        return resp[0];
    }

    this.genomes_to_genome_data_async = function(genomes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.genomes_to_genome_data", [genomes], 1, _callback, _error_callback)
    }

    this.fids_to_regulon_data = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_regulon_data", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_regulon_data", [fids]);
        return resp[0];
    }

    this.fids_to_regulon_data_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_regulon_data", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_feature_data = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_feature_data", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_feature_data", [fids]);
        return resp[0];
    }

    this.fids_to_feature_data_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_feature_data", [fids], 1, _callback, _error_callback)
    }

    this.equiv_sequence_assertions = function(proteins)
    {
	var resp = json_call_ajax_sync("CDMI_API.equiv_sequence_assertions", [proteins]);
//	var resp = json_call_sync("CDMI_API.equiv_sequence_assertions", [proteins]);
        return resp[0];
    }

    this.equiv_sequence_assertions_async = function(proteins, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.equiv_sequence_assertions", [proteins], 1, _callback, _error_callback)
    }

    this.fids_to_atomic_regulons = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_atomic_regulons", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_atomic_regulons", [fids]);
        return resp[0];
    }

    this.fids_to_atomic_regulons_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_atomic_regulons", [fids], 1, _callback, _error_callback)
    }

    this.atomic_regulons_to_fids = function(regulons)
    {
	var resp = json_call_ajax_sync("CDMI_API.atomic_regulons_to_fids", [regulons]);
//	var resp = json_call_sync("CDMI_API.atomic_regulons_to_fids", [regulons]);
        return resp[0];
    }

    this.atomic_regulons_to_fids_async = function(regulons, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.atomic_regulons_to_fids", [regulons], 1, _callback, _error_callback)
    }

    this.fids_to_protein_sequences = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_protein_sequences", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_protein_sequences", [fids]);
        return resp[0];
    }

    this.fids_to_protein_sequences_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_protein_sequences", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_proteins = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_proteins", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_proteins", [fids]);
        return resp[0];
    }

    this.fids_to_proteins_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_proteins", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_dna_sequences = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_dna_sequences", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_dna_sequences", [fids]);
        return resp[0];
    }

    this.fids_to_dna_sequences_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_dna_sequences", [fids], 1, _callback, _error_callback)
    }

    this.roles_to_fids = function(roles, genomes)
    {
	var resp = json_call_ajax_sync("CDMI_API.roles_to_fids", [roles, genomes]);
//	var resp = json_call_sync("CDMI_API.roles_to_fids", [roles, genomes]);
        return resp[0];
    }

    this.roles_to_fids_async = function(roles, genomes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.roles_to_fids", [roles, genomes], 1, _callback, _error_callback)
    }

    this.reactions_to_complexes = function(reactions)
    {
	var resp = json_call_ajax_sync("CDMI_API.reactions_to_complexes", [reactions]);
//	var resp = json_call_sync("CDMI_API.reactions_to_complexes", [reactions]);
        return resp[0];
    }

    this.reactions_to_complexes_async = function(reactions, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.reactions_to_complexes", [reactions], 1, _callback, _error_callback)
    }

    this.reaction_strings = function(reactions, name_parameter)
    {
	var resp = json_call_ajax_sync("CDMI_API.reaction_strings", [reactions, name_parameter]);
//	var resp = json_call_sync("CDMI_API.reaction_strings", [reactions, name_parameter]);
        return resp[0];
    }

    this.reaction_strings_async = function(reactions, name_parameter, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.reaction_strings", [reactions, name_parameter], 1, _callback, _error_callback)
    }

    this.roles_to_complexes = function(roles)
    {
	var resp = json_call_ajax_sync("CDMI_API.roles_to_complexes", [roles]);
//	var resp = json_call_sync("CDMI_API.roles_to_complexes", [roles]);
        return resp[0];
    }

    this.roles_to_complexes_async = function(roles, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.roles_to_complexes", [roles], 1, _callback, _error_callback)
    }

    this.fids_to_subsystem_data = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_subsystem_data", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_subsystem_data", [fids]);
        return resp[0];
    }

    this.fids_to_subsystem_data_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_subsystem_data", [fids], 1, _callback, _error_callback)
    }

    this.representative = function(genomes)
    {
	var resp = json_call_ajax_sync("CDMI_API.representative", [genomes]);
//	var resp = json_call_sync("CDMI_API.representative", [genomes]);
        return resp[0];
    }

    this.representative_async = function(genomes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.representative", [genomes], 1, _callback, _error_callback)
    }

    this.otu_members = function(genomes)
    {
	var resp = json_call_ajax_sync("CDMI_API.otu_members", [genomes]);
//	var resp = json_call_sync("CDMI_API.otu_members", [genomes]);
        return resp[0];
    }

    this.otu_members_async = function(genomes, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.otu_members", [genomes], 1, _callback, _error_callback)
    }

    this.fids_to_genomes = function(fids)
    {
	var resp = json_call_ajax_sync("CDMI_API.fids_to_genomes", [fids]);
//	var resp = json_call_sync("CDMI_API.fids_to_genomes", [fids]);
        return resp[0];
    }

    this.fids_to_genomes_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.fids_to_genomes", [fids], 1, _callback, _error_callback)
    }

    this.text_search = function(input, start, count, entities)
    {
	var resp = json_call_ajax_sync("CDMI_API.text_search", [input, start, count, entities]);
//	var resp = json_call_sync("CDMI_API.text_search", [input, start, count, entities]);
        return resp[0];
    }

    this.text_search_async = function(input, start, count, entities, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_API.text_search", [input, start, count, entities], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function CDMI_EntityAPI(url) {

    var _url = url;


    this.get_entity_AlignmentTree = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_AlignmentTree", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_AlignmentTree", [ids, fields]);
        return resp[0];
    }

    this.get_entity_AlignmentTree_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_AlignmentTree", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_AlignmentTree = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_AlignmentTree", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_AlignmentTree", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_AlignmentTree_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_AlignmentTree", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Annotation = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Annotation", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Annotation", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Annotation_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Annotation", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Annotation = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Annotation", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Annotation", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Annotation_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Annotation", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_AtomicRegulon = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_AtomicRegulon", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_AtomicRegulon", [ids, fields]);
        return resp[0];
    }

    this.get_entity_AtomicRegulon_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_AtomicRegulon", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_AtomicRegulon = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_AtomicRegulon", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_AtomicRegulon", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_AtomicRegulon_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_AtomicRegulon", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Attribute = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Attribute", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Attribute", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Attribute_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Attribute", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Attribute = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Attribute", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Attribute", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Attribute_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Attribute", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Biomass = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Biomass", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Biomass", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Biomass_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Biomass", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Biomass = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Biomass", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Biomass", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Biomass_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Biomass", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_BiomassCompound = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_BiomassCompound", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_BiomassCompound", [ids, fields]);
        return resp[0];
    }

    this.get_entity_BiomassCompound_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_BiomassCompound", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_BiomassCompound = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_BiomassCompound", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_BiomassCompound", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_BiomassCompound_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_BiomassCompound", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Compartment = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Compartment", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Compartment", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Compartment_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Compartment", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Compartment = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Compartment", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Compartment", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Compartment_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Compartment", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Complex = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Complex", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Complex", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Complex_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Complex", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Complex = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Complex", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Complex", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Complex_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Complex", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Compound = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Compound", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Compound", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Compound_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Compound", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Compound = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Compound", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Compound", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Compound_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Compound", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Contig = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Contig", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Contig", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Contig_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Contig", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Contig = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Contig", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Contig", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Contig_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Contig", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_ContigChunk = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_ContigChunk", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_ContigChunk", [ids, fields]);
        return resp[0];
    }

    this.get_entity_ContigChunk_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_ContigChunk", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_ContigChunk = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_ContigChunk", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_ContigChunk", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_ContigChunk_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_ContigChunk", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_ContigSequence = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_ContigSequence", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_ContigSequence", [ids, fields]);
        return resp[0];
    }

    this.get_entity_ContigSequence_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_ContigSequence", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_ContigSequence = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_ContigSequence", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_ContigSequence", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_ContigSequence_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_ContigSequence", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_CoregulatedSet = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_CoregulatedSet", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_CoregulatedSet", [ids, fields]);
        return resp[0];
    }

    this.get_entity_CoregulatedSet_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_CoregulatedSet", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_CoregulatedSet = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_CoregulatedSet", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_CoregulatedSet", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_CoregulatedSet_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_CoregulatedSet", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Diagram = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Diagram", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Diagram", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Diagram_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Diagram", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Diagram = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Diagram", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Diagram", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Diagram_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Diagram", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_EcNumber = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_EcNumber", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_EcNumber", [ids, fields]);
        return resp[0];
    }

    this.get_entity_EcNumber_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_EcNumber", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_EcNumber = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_EcNumber", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_EcNumber", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_EcNumber_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_EcNumber", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Experiment = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Experiment", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Experiment", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Experiment_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Experiment", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Experiment = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Experiment", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Experiment", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Experiment_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Experiment", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Family = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Family", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Family", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Family_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Family", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Family = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Family", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Family", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Family_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Family", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Feature = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Feature", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Feature", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Feature_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Feature", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Feature = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Feature", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Feature", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Feature_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Feature", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Genome = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Genome", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Genome", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Genome_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Genome", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Genome = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Genome", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Genome", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Genome_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Genome", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Identifier = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Identifier", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Identifier", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Identifier_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Identifier", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Identifier = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Identifier", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Identifier", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Identifier_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Identifier", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Media = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Media", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Media", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Media_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Media", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Media = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Media", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Media", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Media_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Media", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Model = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Model", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Model", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Model_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Model", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Model = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Model", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Model", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Model_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Model", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_ModelCompartment = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_ModelCompartment", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_ModelCompartment", [ids, fields]);
        return resp[0];
    }

    this.get_entity_ModelCompartment_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_ModelCompartment", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_ModelCompartment = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_ModelCompartment", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_ModelCompartment", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_ModelCompartment_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_ModelCompartment", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_OTU = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_OTU", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_OTU", [ids, fields]);
        return resp[0];
    }

    this.get_entity_OTU_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_OTU", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_OTU = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_OTU", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_OTU", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_OTU_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_OTU", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_PairSet = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_PairSet", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_PairSet", [ids, fields]);
        return resp[0];
    }

    this.get_entity_PairSet_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_PairSet", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_PairSet = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_PairSet", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_PairSet", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_PairSet_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_PairSet", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Pairing = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Pairing", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Pairing", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Pairing_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Pairing", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Pairing = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Pairing", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Pairing", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Pairing_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Pairing", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_ProbeSet = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_ProbeSet", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_ProbeSet", [ids, fields]);
        return resp[0];
    }

    this.get_entity_ProbeSet_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_ProbeSet", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_ProbeSet = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_ProbeSet", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_ProbeSet", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_ProbeSet_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_ProbeSet", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_ProteinSequence = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_ProteinSequence", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_ProteinSequence", [ids, fields]);
        return resp[0];
    }

    this.get_entity_ProteinSequence_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_ProteinSequence", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_ProteinSequence = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_ProteinSequence", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_ProteinSequence", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_ProteinSequence_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_ProteinSequence", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Publication = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Publication", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Publication", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Publication_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Publication", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Publication = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Publication", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Publication", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Publication_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Publication", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Reaction = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Reaction", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Reaction", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Reaction_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Reaction", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Reaction = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Reaction", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Reaction", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Reaction_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Reaction", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_ReactionRule = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_ReactionRule", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_ReactionRule", [ids, fields]);
        return resp[0];
    }

    this.get_entity_ReactionRule_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_ReactionRule", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_ReactionRule = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_ReactionRule", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_ReactionRule", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_ReactionRule_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_ReactionRule", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Reagent = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Reagent", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Reagent", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Reagent_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Reagent", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Reagent = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Reagent", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Reagent", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Reagent_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Reagent", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Requirement = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Requirement", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Requirement", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Requirement_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Requirement", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Requirement = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Requirement", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Requirement", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Requirement_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Requirement", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Role = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Role", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Role", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Role_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Role", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Role = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Role", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Role", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Role_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Role", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_SSCell = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_SSCell", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_SSCell", [ids, fields]);
        return resp[0];
    }

    this.get_entity_SSCell_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_SSCell", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_SSCell = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_SSCell", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_SSCell", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_SSCell_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_SSCell", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_SSRow = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_SSRow", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_SSRow", [ids, fields]);
        return resp[0];
    }

    this.get_entity_SSRow_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_SSRow", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_SSRow = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_SSRow", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_SSRow", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_SSRow_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_SSRow", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Scenario = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Scenario", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Scenario", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Scenario_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Scenario", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Scenario = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Scenario", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Scenario", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Scenario_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Scenario", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Source = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Source", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Source", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Source_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Source", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Source = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Source", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Source", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Source_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Source", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Subsystem = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Subsystem", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Subsystem", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Subsystem_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Subsystem", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Subsystem = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Subsystem", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Subsystem", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Subsystem_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Subsystem", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_SubsystemClass = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_SubsystemClass", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_SubsystemClass", [ids, fields]);
        return resp[0];
    }

    this.get_entity_SubsystemClass_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_SubsystemClass", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_SubsystemClass = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_SubsystemClass", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_SubsystemClass", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_SubsystemClass_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_SubsystemClass", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_TaxonomicGrouping = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_TaxonomicGrouping", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_TaxonomicGrouping", [ids, fields]);
        return resp[0];
    }

    this.get_entity_TaxonomicGrouping_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_TaxonomicGrouping", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_TaxonomicGrouping = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_TaxonomicGrouping", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_TaxonomicGrouping", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_TaxonomicGrouping_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_TaxonomicGrouping", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Variant = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Variant", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Variant", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Variant_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Variant", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Variant = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Variant", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Variant", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Variant_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Variant", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_entity_Variation = function(ids, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_entity_Variation", [ids, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_entity_Variation", [ids, fields]);
        return resp[0];
    }

    this.get_entity_Variation_async = function(ids, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_entity_Variation", [ids, fields], 1, _callback, _error_callback)
    }

    this.all_entities_Variation = function(start, count, fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.all_entities_Variation", [start, count, fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.all_entities_Variation", [start, count, fields]);
        return resp[0];
    }

    this.all_entities_Variation_async = function(start, count, fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.all_entities_Variation", [start, count, fields], 1, _callback, _error_callback)
    }

    this.get_relationship_AffectsLevelOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_AffectsLevelOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_AffectsLevelOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_AffectsLevelOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_AffectsLevelOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsAffectedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsAffectedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsAffectedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsAffectedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsAffectedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Aligns = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Aligns", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Aligns", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Aligns_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Aligns", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsAlignedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsAlignedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsAlignedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsAlignedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsAlignedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Concerns = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Concerns", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Concerns", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Concerns_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Concerns", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsATopicOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsATopicOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsATopicOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsATopicOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsATopicOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Contains = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Contains", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Contains", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Contains_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Contains", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsContainedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsContainedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsContainedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsContainedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsContainedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Describes = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Describes", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Describes", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Describes_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Describes", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsDescribedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsDescribedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsDescribedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsDescribedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsDescribedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Displays = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Displays", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Displays", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Displays_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Displays", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsDisplayedOn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsDisplayedOn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsDisplayedOn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsDisplayedOn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsDisplayedOn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Encompasses = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Encompasses", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Encompasses", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Encompasses_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Encompasses", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsEncompassedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsEncompassedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsEncompassedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsEncompassedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsEncompassedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_GeneratedLevelsFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_GeneratedLevelsFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_GeneratedLevelsFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_GeneratedLevelsFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_GeneratedLevelsFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_WasGeneratedFrom = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_WasGeneratedFrom", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_WasGeneratedFrom", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_WasGeneratedFrom_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_WasGeneratedFrom", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasAssertionFrom = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasAssertionFrom", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasAssertionFrom", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasAssertionFrom_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasAssertionFrom", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Asserts = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Asserts", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Asserts", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Asserts_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Asserts", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasCompoundAliasFrom = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasCompoundAliasFrom", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasCompoundAliasFrom", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasCompoundAliasFrom_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasCompoundAliasFrom", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_UsesAliasForCompound = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_UsesAliasForCompound", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_UsesAliasForCompound", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_UsesAliasForCompound_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_UsesAliasForCompound", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasIndicatedSignalFrom = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasIndicatedSignalFrom", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasIndicatedSignalFrom", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasIndicatedSignalFrom_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasIndicatedSignalFrom", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IndicatesSignalFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IndicatesSignalFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IndicatesSignalFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IndicatesSignalFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IndicatesSignalFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasMember = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasMember", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasMember", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasMember_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasMember", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsMemberOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsMemberOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsMemberOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsMemberOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsMemberOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasParticipant = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasParticipant", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasParticipant", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasParticipant_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasParticipant", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_ParticipatesIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_ParticipatesIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_ParticipatesIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_ParticipatesIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_ParticipatesIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasPresenceOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasPresenceOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasPresenceOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasPresenceOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasPresenceOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsPresentIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsPresentIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsPresentIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsPresentIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsPresentIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasReactionAliasFrom = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasReactionAliasFrom", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasReactionAliasFrom", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasReactionAliasFrom_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasReactionAliasFrom", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_UsesAliasForReaction = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_UsesAliasForReaction", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_UsesAliasForReaction", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_UsesAliasForReaction_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_UsesAliasForReaction", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasRepresentativeOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasRepresentativeOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasRepresentativeOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasRepresentativeOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasRepresentativeOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsRepresentedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsRepresentedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsRepresentedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsRepresentedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsRepresentedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasResultsIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasResultsIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasResultsIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasResultsIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasResultsIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasResultsFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasResultsFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasResultsFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasResultsFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasResultsFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasSection = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasSection", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasSection", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasSection_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasSection", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsSectionOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsSectionOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsSectionOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsSectionOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsSectionOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasStep = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasStep", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasStep", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasStep_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasStep", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsStepOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsStepOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsStepOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsStepOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsStepOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasUsage = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasUsage", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasUsage", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasUsage_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasUsage", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsUsageOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsUsageOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsUsageOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsUsageOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsUsageOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasValueFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasValueFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasValueFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasValueFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasValueFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasValueIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasValueIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasValueIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasValueIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasValueIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Includes = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Includes", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Includes", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Includes_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Includes", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsIncludedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsIncludedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsIncludedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsIncludedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsIncludedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IndicatedLevelsFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IndicatedLevelsFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IndicatedLevelsFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IndicatedLevelsFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IndicatedLevelsFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasLevelsFrom = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasLevelsFrom", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasLevelsFrom", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasLevelsFrom_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasLevelsFrom", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Involves = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Involves", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Involves", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Involves_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Involves", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsInvolvedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsInvolvedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsInvolvedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsInvolvedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsInvolvedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsARequirementIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsARequirementIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsARequirementIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsARequirementIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsARequirementIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsARequirementOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsARequirementOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsARequirementOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsARequirementOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsARequirementOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsAlignedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsAlignedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsAlignedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsAlignedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsAlignedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsAlignmentFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsAlignmentFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsAlignmentFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsAlignmentFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsAlignmentFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsAnnotatedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsAnnotatedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsAnnotatedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsAnnotatedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsAnnotatedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Annotates = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Annotates", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Annotates", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Annotates_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Annotates", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsBindingSiteFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsBindingSiteFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsBindingSiteFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsBindingSiteFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsBindingSiteFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsBoundBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsBoundBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsBoundBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsBoundBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsBoundBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsClassFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsClassFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsClassFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsClassFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsClassFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsInClass = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsInClass", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsInClass", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsInClass_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsInClass", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsCollectionOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsCollectionOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsCollectionOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsCollectionOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsCollectionOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsCollectedInto = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsCollectedInto", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsCollectedInto", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsCollectedInto_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsCollectedInto", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsComposedOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsComposedOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsComposedOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsComposedOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsComposedOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsComponentOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsComponentOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsComponentOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsComponentOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsComponentOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsComprisedOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsComprisedOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsComprisedOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsComprisedOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsComprisedOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Comprises = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Comprises", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Comprises", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Comprises_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Comprises", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsConfiguredBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsConfiguredBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsConfiguredBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsConfiguredBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsConfiguredBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_ReflectsStateOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_ReflectsStateOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_ReflectsStateOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_ReflectsStateOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_ReflectsStateOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsConsistentWith = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsConsistentWith", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsConsistentWith", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsConsistentWith_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsConsistentWith", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsConsistentTo = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsConsistentTo", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsConsistentTo", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsConsistentTo_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsConsistentTo", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsControlledUsing = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsControlledUsing", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsControlledUsing", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsControlledUsing_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsControlledUsing", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Controls = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Controls", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Controls", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Controls_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Controls", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsCoregulatedWith = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsCoregulatedWith", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsCoregulatedWith", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsCoregulatedWith_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsCoregulatedWith", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasCoregulationWith = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasCoregulationWith", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasCoregulationWith", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasCoregulationWith_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasCoregulationWith", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsCoupledTo = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsCoupledTo", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsCoupledTo", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsCoupledTo_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsCoupledTo", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsCoupledWith = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsCoupledWith", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsCoupledWith", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsCoupledWith_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsCoupledWith", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsDefaultFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsDefaultFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsDefaultFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsDefaultFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsDefaultFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_RunsByDefaultIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_RunsByDefaultIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_RunsByDefaultIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_RunsByDefaultIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_RunsByDefaultIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsDefaultLocationOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsDefaultLocationOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsDefaultLocationOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsDefaultLocationOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsDefaultLocationOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasDefaultLocation = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasDefaultLocation", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasDefaultLocation", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasDefaultLocation_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasDefaultLocation", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsDeterminedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsDeterminedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsDeterminedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsDeterminedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsDeterminedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Determines = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Determines", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Determines", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Determines_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Determines", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsDividedInto = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsDividedInto", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsDividedInto", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsDividedInto_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsDividedInto", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsDivisionOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsDivisionOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsDivisionOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsDivisionOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsDivisionOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsExemplarOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsExemplarOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsExemplarOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsExemplarOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsExemplarOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasAsExemplar = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasAsExemplar", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasAsExemplar", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasAsExemplar_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasAsExemplar", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsFamilyFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsFamilyFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsFamilyFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsFamilyFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsFamilyFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_DeterminesFunctionOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_DeterminesFunctionOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_DeterminesFunctionOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_DeterminesFunctionOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_DeterminesFunctionOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsFormedOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsFormedOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsFormedOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsFormedOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsFormedOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsFormedInto = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsFormedInto", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsFormedInto", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsFormedInto_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsFormedInto", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsFunctionalIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsFunctionalIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsFunctionalIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsFunctionalIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsFunctionalIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasFunctional = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasFunctional", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasFunctional", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasFunctional_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasFunctional", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsGroupFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsGroupFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsGroupFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsGroupFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsGroupFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsInGroup = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsInGroup", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsInGroup", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsInGroup_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsInGroup", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsImplementedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsImplementedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsImplementedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsImplementedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsImplementedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Implements = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Implements", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Implements", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Implements_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Implements", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsInPair = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsInPair", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsInPair", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsInPair_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsInPair", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsPairOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsPairOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsPairOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsPairOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsPairOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsInstantiatedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsInstantiatedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsInstantiatedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsInstantiatedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsInstantiatedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsInstanceOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsInstanceOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsInstanceOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsInstanceOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsInstanceOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsLocatedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsLocatedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsLocatedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsLocatedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsLocatedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsLocusFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsLocusFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsLocusFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsLocusFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsLocusFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsModeledBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsModeledBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsModeledBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsModeledBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsModeledBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Models = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Models", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Models", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Models_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Models", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsNamedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsNamedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsNamedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsNamedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsNamedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Names = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Names", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Names", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Names_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Names", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsOwnerOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsOwnerOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsOwnerOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsOwnerOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsOwnerOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsOwnedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsOwnedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsOwnedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsOwnedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsOwnedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsProposedLocationOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsProposedLocationOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsProposedLocationOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsProposedLocationOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsProposedLocationOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasProposedLocationIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasProposedLocationIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasProposedLocationIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasProposedLocationIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasProposedLocationIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsProteinFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsProteinFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsProteinFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsProteinFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsProteinFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Produces = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Produces", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Produces", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Produces_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Produces", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsRealLocationOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsRealLocationOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsRealLocationOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsRealLocationOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsRealLocationOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasRealLocationIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasRealLocationIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasRealLocationIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasRealLocationIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasRealLocationIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsRegulatedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsRegulatedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsRegulatedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsRegulatedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsRegulatedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsRegulatedSetOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsRegulatedSetOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsRegulatedSetOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsRegulatedSetOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsRegulatedSetOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsRelevantFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsRelevantFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsRelevantFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsRelevantFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsRelevantFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsRelevantTo = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsRelevantTo", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsRelevantTo", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsRelevantTo_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsRelevantTo", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsRequiredBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsRequiredBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsRequiredBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsRequiredBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsRequiredBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Requires = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Requires", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Requires", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Requires_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Requires", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsRoleOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsRoleOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsRoleOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsRoleOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsRoleOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasRole = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasRole", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasRole", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasRole_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasRole", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsRowOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsRowOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsRowOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsRowOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsRowOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsRoleFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsRoleFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsRoleFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsRoleFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsRoleFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsSequenceOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsSequenceOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsSequenceOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsSequenceOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsSequenceOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasAsSequence = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasAsSequence", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasAsSequence", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasAsSequence_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasAsSequence", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsSubInstanceOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsSubInstanceOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsSubInstanceOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsSubInstanceOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsSubInstanceOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Validates = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Validates", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Validates", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Validates_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Validates", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsSuperclassOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsSuperclassOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsSuperclassOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsSuperclassOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsSuperclassOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsSubclassOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsSubclassOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsSubclassOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsSubclassOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsSubclassOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsTargetOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsTargetOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsTargetOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsTargetOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsTargetOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Targets = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Targets", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Targets", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Targets_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Targets", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsTaxonomyOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsTaxonomyOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsTaxonomyOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsTaxonomyOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsTaxonomyOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsInTaxa = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsInTaxa", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsInTaxa", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsInTaxa_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsInTaxa", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsTerminusFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsTerminusFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsTerminusFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsTerminusFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsTerminusFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HasAsTerminus = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HasAsTerminus", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HasAsTerminus", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HasAsTerminus_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HasAsTerminus", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsTriggeredBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsTriggeredBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsTriggeredBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsTriggeredBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsTriggeredBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Triggers = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Triggers", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Triggers", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Triggers_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Triggers", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsUsedAs = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsUsedAs", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsUsedAs", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsUsedAs_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsUsedAs", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsUseOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsUseOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsUseOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsUseOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsUseOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Manages = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Manages", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Manages", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Manages_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Manages", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsManagedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsManagedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsManagedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsManagedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsManagedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_OperatesIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_OperatesIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_OperatesIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_OperatesIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_OperatesIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsUtilizedIn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsUtilizedIn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsUtilizedIn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsUtilizedIn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsUtilizedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Overlaps = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Overlaps", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Overlaps", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Overlaps_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Overlaps", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IncludesPartOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IncludesPartOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IncludesPartOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IncludesPartOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IncludesPartOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_ParticipatesAs = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_ParticipatesAs", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_ParticipatesAs", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_ParticipatesAs_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_ParticipatesAs", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsParticipationOf = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsParticipationOf", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsParticipationOf", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsParticipationOf_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsParticipationOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_ProducedResultsFor = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_ProducedResultsFor", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_ProducedResultsFor", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_ProducedResultsFor_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_ProducedResultsFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_HadResultsProducedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_HadResultsProducedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_HadResultsProducedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_HadResultsProducedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_HadResultsProducedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_ProjectsOnto = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_ProjectsOnto", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_ProjectsOnto", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_ProjectsOnto_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_ProjectsOnto", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsProjectedOnto = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsProjectedOnto", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsProjectedOnto", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsProjectedOnto_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsProjectedOnto", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Provided = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Provided", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Provided", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Provided_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Provided", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_WasProvidedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_WasProvidedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_WasProvidedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_WasProvidedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_WasProvidedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Shows = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Shows", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Shows", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Shows_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Shows", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsShownOn = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsShownOn", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsShownOn", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsShownOn_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsShownOn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Submitted = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Submitted", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Submitted", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Submitted_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Submitted", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_WasSubmittedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_WasSubmittedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_WasSubmittedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_WasSubmittedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_WasSubmittedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_Uses = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_Uses", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_Uses", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_Uses_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_Uses", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    this.get_relationship_IsUsedBy = function(ids, from_fields, rel_fields, to_fields)
    {
	var resp = json_call_ajax_sync("CDMI_EntityAPI.get_relationship_IsUsedBy", [ids, from_fields, rel_fields, to_fields]);
//	var resp = json_call_sync("CDMI_EntityAPI.get_relationship_IsUsedBy", [ids, from_fields, rel_fields, to_fields]);
        return resp[0];
    }

    this.get_relationship_IsUsedBy_async = function(ids, from_fields, rel_fields, to_fields, _callback, _error_callback)
    {
	json_call_ajax_async("CDMI_EntityAPI.get_relationship_IsUsedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function KBaseRegPrecise(url) {

    var _url = url;


    this.getRegulomeModelCollections = function()
    {
	var resp = json_call_ajax_sync("KBaseRegPrecise.getRegulomeModelCollections", []);
//	var resp = json_call_sync("KBaseRegPrecise.getRegulomeModelCollections", []);
        return resp[0];
    }

    this.getRegulomeModelCollections_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("KBaseRegPrecise.getRegulomeModelCollections", [], 1, _callback, _error_callback)
    }

    this.getRegulomeModelCollection = function(collectionId)
    {
	var resp = json_call_ajax_sync("KBaseRegPrecise.getRegulomeModelCollection", [collectionId]);
//	var resp = json_call_sync("KBaseRegPrecise.getRegulomeModelCollection", [collectionId]);
        return resp[0];
    }

    this.getRegulomeModelCollection_async = function(collectionId, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseRegPrecise.getRegulomeModelCollection", [collectionId], 1, _callback, _error_callback)
    }

    this.getRegulomeModelsByCollectionId = function(collectionId)
    {
	var resp = json_call_ajax_sync("KBaseRegPrecise.getRegulomeModelsByCollectionId", [collectionId]);
//	var resp = json_call_sync("KBaseRegPrecise.getRegulomeModelsByCollectionId", [collectionId]);
        return resp[0];
    }

    this.getRegulomeModelsByCollectionId_async = function(collectionId, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseRegPrecise.getRegulomeModelsByCollectionId", [collectionId], 1, _callback, _error_callback)
    }

    this.getRegulomeModelsByGenomeId = function(genomeId)
    {
	var resp = json_call_ajax_sync("KBaseRegPrecise.getRegulomeModelsByGenomeId", [genomeId]);
//	var resp = json_call_sync("KBaseRegPrecise.getRegulomeModelsByGenomeId", [genomeId]);
        return resp[0];
    }

    this.getRegulomeModelsByGenomeId_async = function(genomeId, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseRegPrecise.getRegulomeModelsByGenomeId", [genomeId], 1, _callback, _error_callback)
    }

    this.getRegulomeModelsBySourceType = function(regulomeSource)
    {
	var resp = json_call_ajax_sync("KBaseRegPrecise.getRegulomeModelsBySourceType", [regulomeSource]);
//	var resp = json_call_sync("KBaseRegPrecise.getRegulomeModelsBySourceType", [regulomeSource]);
        return resp[0];
    }

    this.getRegulomeModelsBySourceType_async = function(regulomeSource, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseRegPrecise.getRegulomeModelsBySourceType", [regulomeSource], 1, _callback, _error_callback)
    }

    this.getRegulomeModel = function(regulomeModelId)
    {
	var resp = json_call_ajax_sync("KBaseRegPrecise.getRegulomeModel", [regulomeModelId]);
//	var resp = json_call_sync("KBaseRegPrecise.getRegulomeModel", [regulomeModelId]);
        return resp[0];
    }

    this.getRegulomeModel_async = function(regulomeModelId, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseRegPrecise.getRegulomeModel", [regulomeModelId], 1, _callback, _error_callback)
    }

    this.getRegulonModelStats = function(regulomeModelId)
    {
	var resp = json_call_ajax_sync("KBaseRegPrecise.getRegulonModelStats", [regulomeModelId]);
//	var resp = json_call_sync("KBaseRegPrecise.getRegulonModelStats", [regulomeModelId]);
        return resp[0];
    }

    this.getRegulonModelStats_async = function(regulomeModelId, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseRegPrecise.getRegulonModelStats", [regulomeModelId], 1, _callback, _error_callback)
    }

    this.getRegulonModel = function(regulonModelId)
    {
	var resp = json_call_ajax_sync("KBaseRegPrecise.getRegulonModel", [regulonModelId]);
//	var resp = json_call_sync("KBaseRegPrecise.getRegulonModel", [regulonModelId]);
        return resp[0];
    }

    this.getRegulonModel_async = function(regulonModelId, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseRegPrecise.getRegulonModel", [regulonModelId], 1, _callback, _error_callback)
    }

    this.buildRegulomeModel = function(param)
    {
	var resp = json_call_ajax_sync("KBaseRegPrecise.buildRegulomeModel", [param]);
//	var resp = json_call_sync("KBaseRegPrecise.buildRegulomeModel", [param]);
        return resp[0];
    }

    this.buildRegulomeModel_async = function(param, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseRegPrecise.buildRegulomeModel", [param], 1, _callback, _error_callback)
    }

    this.getProcessState = function(processId)
    {
	var resp = json_call_ajax_sync("KBaseRegPrecise.getProcessState", [processId]);
//	var resp = json_call_sync("KBaseRegPrecise.getProcessState", [processId]);
        return resp[0];
    }

    this.getProcessState_async = function(processId, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseRegPrecise.getProcessState", [processId], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function MOTranslation(url) {

    var _url = url;


    this.fids_to_moLocusIds = function(fids)
    {
	var resp = json_call_ajax_sync("MOTranslation.fids_to_moLocusIds", [fids]);
//	var resp = json_call_sync("MOTranslation.fids_to_moLocusIds", [fids]);
        return resp[0];
    }

    this.fids_to_moLocusIds_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("MOTranslation.fids_to_moLocusIds", [fids], 1, _callback, _error_callback)
    }

    this.proteins_to_moLocusIds = function(proteins)
    {
	var resp = json_call_ajax_sync("MOTranslation.proteins_to_moLocusIds", [proteins]);
//	var resp = json_call_sync("MOTranslation.proteins_to_moLocusIds", [proteins]);
        return resp[0];
    }

    this.proteins_to_moLocusIds_async = function(proteins, _callback, _error_callback)
    {
	json_call_ajax_async("MOTranslation.proteins_to_moLocusIds", [proteins], 1, _callback, _error_callback)
    }

    this.moLocusIds_to_fids = function(moLocusIds)
    {
	var resp = json_call_ajax_sync("MOTranslation.moLocusIds_to_fids", [moLocusIds]);
//	var resp = json_call_sync("MOTranslation.moLocusIds_to_fids", [moLocusIds]);
        return resp[0];
    }

    this.moLocusIds_to_fids_async = function(moLocusIds, _callback, _error_callback)
    {
	json_call_ajax_async("MOTranslation.moLocusIds_to_fids", [moLocusIds], 1, _callback, _error_callback)
    }

    this.moLocusIds_to_proteins = function(moLocusIds)
    {
	var resp = json_call_ajax_sync("MOTranslation.moLocusIds_to_proteins", [moLocusIds]);
//	var resp = json_call_sync("MOTranslation.moLocusIds_to_proteins", [moLocusIds]);
        return resp[0];
    }

    this.moLocusIds_to_proteins_async = function(moLocusIds, _callback, _error_callback)
    {
	json_call_ajax_async("MOTranslation.moLocusIds_to_proteins", [moLocusIds], 1, _callback, _error_callback)
    }

    this.map_to_fid = function(query_sequences, genomeId)
    {
	var resp = json_call_ajax_sync("MOTranslation.map_to_fid", [query_sequences, genomeId]);
//	var resp = json_call_sync("MOTranslation.map_to_fid", [query_sequences, genomeId]);
        return resp;
    }

    this.map_to_fid_async = function(query_sequences, genomeId, _callback, _error_callback)
    {
	json_call_ajax_async("MOTranslation.map_to_fid", [query_sequences, genomeId], 2, _callback, _error_callback)
    }

    this.map_to_fid_fast = function(query_md5s, genomeId)
    {
	var resp = json_call_ajax_sync("MOTranslation.map_to_fid_fast", [query_md5s, genomeId]);
//	var resp = json_call_sync("MOTranslation.map_to_fid_fast", [query_md5s, genomeId]);
        return resp;
    }

    this.map_to_fid_fast_async = function(query_md5s, genomeId, _callback, _error_callback)
    {
	json_call_ajax_async("MOTranslation.map_to_fid_fast", [query_md5s, genomeId], 2, _callback, _error_callback)
    }

    this.moLocusIds_to_fid_in_genome = function(moLocusIds, genomeId)
    {
	var resp = json_call_ajax_sync("MOTranslation.moLocusIds_to_fid_in_genome", [moLocusIds, genomeId]);
//	var resp = json_call_sync("MOTranslation.moLocusIds_to_fid_in_genome", [moLocusIds, genomeId]);
        return resp;
    }

    this.moLocusIds_to_fid_in_genome_async = function(moLocusIds, genomeId, _callback, _error_callback)
    {
	json_call_ajax_async("MOTranslation.moLocusIds_to_fid_in_genome", [moLocusIds, genomeId], 2, _callback, _error_callback)
    }

    this.moLocusIds_to_fid_in_genome_fast = function(moLocusIds, genomeId)
    {
	var resp = json_call_ajax_sync("MOTranslation.moLocusIds_to_fid_in_genome_fast", [moLocusIds, genomeId]);
//	var resp = json_call_sync("MOTranslation.moLocusIds_to_fid_in_genome_fast", [moLocusIds, genomeId]);
        return resp;
    }

    this.moLocusIds_to_fid_in_genome_fast_async = function(moLocusIds, genomeId, _callback, _error_callback)
    {
	json_call_ajax_async("MOTranslation.moLocusIds_to_fid_in_genome_fast", [moLocusIds, genomeId], 2, _callback, _error_callback)
    }

    this.moTaxonomyId_to_genomes = function(moTaxonomyId)
    {
	var resp = json_call_ajax_sync("MOTranslation.moTaxonomyId_to_genomes", [moTaxonomyId]);
//	var resp = json_call_sync("MOTranslation.moTaxonomyId_to_genomes", [moTaxonomyId]);
        return resp[0];
    }

    this.moTaxonomyId_to_genomes_async = function(moTaxonomyId, _callback, _error_callback)
    {
	json_call_ajax_async("MOTranslation.moTaxonomyId_to_genomes", [moTaxonomyId], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function KBaseNetworks(url) {

    var _url = url;


    this.allDatasets = function()
    {
	var resp = json_call_ajax_sync("KBaseNetworks.allDatasets", []);
//	var resp = json_call_sync("KBaseNetworks.allDatasets", []);
        return resp[0];
    }

    this.allDatasets_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("KBaseNetworks.allDatasets", [], 1, _callback, _error_callback)
    }

    this.allDatasetSources = function()
    {
	var resp = json_call_ajax_sync("KBaseNetworks.allDatasetSources", []);
//	var resp = json_call_sync("KBaseNetworks.allDatasetSources", []);
        return resp[0];
    }

    this.allDatasetSources_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("KBaseNetworks.allDatasetSources", [], 1, _callback, _error_callback)
    }

    this.allNetworkTypes = function()
    {
	var resp = json_call_ajax_sync("KBaseNetworks.allNetworkTypes", []);
//	var resp = json_call_sync("KBaseNetworks.allNetworkTypes", []);
        return resp[0];
    }

    this.allNetworkTypes_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("KBaseNetworks.allNetworkTypes", [], 1, _callback, _error_callback)
    }

    this.datasetSource2Datasets = function(datasetSourceRef)
    {
	var resp = json_call_ajax_sync("KBaseNetworks.datasetSource2Datasets", [datasetSourceRef]);
//	var resp = json_call_sync("KBaseNetworks.datasetSource2Datasets", [datasetSourceRef]);
        return resp[0];
    }

    this.datasetSource2Datasets_async = function(datasetSourceRef, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseNetworks.datasetSource2Datasets", [datasetSourceRef], 1, _callback, _error_callback)
    }

    this.taxon2Datasets = function(taxon)
    {
	var resp = json_call_ajax_sync("KBaseNetworks.taxon2Datasets", [taxon]);
//	var resp = json_call_sync("KBaseNetworks.taxon2Datasets", [taxon]);
        return resp[0];
    }

    this.taxon2Datasets_async = function(taxon, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseNetworks.taxon2Datasets", [taxon], 1, _callback, _error_callback)
    }

    this.networkType2Datasets = function(networkType)
    {
	var resp = json_call_ajax_sync("KBaseNetworks.networkType2Datasets", [networkType]);
//	var resp = json_call_sync("KBaseNetworks.networkType2Datasets", [networkType]);
        return resp[0];
    }

    this.networkType2Datasets_async = function(networkType, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseNetworks.networkType2Datasets", [networkType], 1, _callback, _error_callback)
    }

    this.entity2Datasets = function(entityId)
    {
	var resp = json_call_ajax_sync("KBaseNetworks.entity2Datasets", [entityId]);
//	var resp = json_call_sync("KBaseNetworks.entity2Datasets", [entityId]);
        return resp[0];
    }

    this.entity2Datasets_async = function(entityId, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseNetworks.entity2Datasets", [entityId], 1, _callback, _error_callback)
    }

    this.buildFirstNeighborNetwork = function(datasetIds, entityIds, edgeTypes)
    {
	var resp = json_call_ajax_sync("KBaseNetworks.buildFirstNeighborNetwork", [datasetIds, entityIds, edgeTypes]);
//	var resp = json_call_sync("KBaseNetworks.buildFirstNeighborNetwork", [datasetIds, entityIds, edgeTypes]);
        return resp[0];
    }

    this.buildFirstNeighborNetwork_async = function(datasetIds, entityIds, edgeTypes, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseNetworks.buildFirstNeighborNetwork", [datasetIds, entityIds, edgeTypes], 1, _callback, _error_callback)
    }

    this.buildFirstNeighborNetworkLimtedByStrength = function(datasetIds, entityIds, edgeTypes, cutOff)
    {
	var resp = json_call_ajax_sync("KBaseNetworks.buildFirstNeighborNetworkLimtedByStrength", [datasetIds, entityIds, edgeTypes, cutOff]);
//	var resp = json_call_sync("KBaseNetworks.buildFirstNeighborNetworkLimtedByStrength", [datasetIds, entityIds, edgeTypes, cutOff]);
        return resp[0];
    }

    this.buildFirstNeighborNetworkLimtedByStrength_async = function(datasetIds, entityIds, edgeTypes, cutOff, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseNetworks.buildFirstNeighborNetworkLimtedByStrength", [datasetIds, entityIds, edgeTypes, cutOff], 1, _callback, _error_callback)
    }

    this.buildInternalNetwork = function(datasetIds, geneIds, edgeTypes)
    {
	var resp = json_call_ajax_sync("KBaseNetworks.buildInternalNetwork", [datasetIds, geneIds, edgeTypes]);
//	var resp = json_call_sync("KBaseNetworks.buildInternalNetwork", [datasetIds, geneIds, edgeTypes]);
        return resp[0];
    }

    this.buildInternalNetwork_async = function(datasetIds, geneIds, edgeTypes, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseNetworks.buildInternalNetwork", [datasetIds, geneIds, edgeTypes], 1, _callback, _error_callback)
    }

    this.buildInternalNetworkLimitedByStrength = function(datasetIds, geneIds, edgeTypes, cutOff)
    {
	var resp = json_call_ajax_sync("KBaseNetworks.buildInternalNetworkLimitedByStrength", [datasetIds, geneIds, edgeTypes, cutOff]);
//	var resp = json_call_sync("KBaseNetworks.buildInternalNetworkLimitedByStrength", [datasetIds, geneIds, edgeTypes, cutOff]);
        return resp[0];
    }

    this.buildInternalNetworkLimitedByStrength_async = function(datasetIds, geneIds, edgeTypes, cutOff, _callback, _error_callback)
    {
	json_call_ajax_async("KBaseNetworks.buildInternalNetworkLimitedByStrength", [datasetIds, geneIds, edgeTypes, cutOff], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function PlantExpression(url) {

    var _url = url;


    this.getExperimentsBySeriesID = function(ids)
    {
	var resp = json_call_ajax_sync("PlantExpression.getExperimentsBySeriesID", [ids]);
//	var resp = json_call_sync("PlantExpression.getExperimentsBySeriesID", [ids]);
        return resp[0];
    }

    this.getExperimentsBySeriesID_async = function(ids, _callback, _error_callback)
    {
	json_call_ajax_async("PlantExpression.getExperimentsBySeriesID", [ids], 1, _callback, _error_callback)
    }

    this.getExperimentsBySampleID = function(ids)
    {
	var resp = json_call_ajax_sync("PlantExpression.getExperimentsBySampleID", [ids]);
//	var resp = json_call_sync("PlantExpression.getExperimentsBySampleID", [ids]);
        return resp[0];
    }

    this.getExperimentsBySampleID_async = function(ids, _callback, _error_callback)
    {
	json_call_ajax_async("PlantExpression.getExperimentsBySampleID", [ids], 1, _callback, _error_callback)
    }

    this.getExperimentsBySampleIDnGeneID = function(ids, gl)
    {
	var resp = json_call_ajax_sync("PlantExpression.getExperimentsBySampleIDnGeneID", [ids, gl]);
//	var resp = json_call_sync("PlantExpression.getExperimentsBySampleIDnGeneID", [ids, gl]);
        return resp[0];
    }

    this.getExperimentsBySampleIDnGeneID_async = function(ids, gl, _callback, _error_callback)
    {
	json_call_ajax_async("PlantExpression.getExperimentsBySampleIDnGeneID", [ids, gl], 1, _callback, _error_callback)
    }

    this.getEOSampleIDList = function(lst)
    {
	var resp = json_call_ajax_sync("PlantExpression.getEOSampleIDList", [lst]);
//	var resp = json_call_sync("PlantExpression.getEOSampleIDList", [lst]);
        return resp[0];
    }

    this.getEOSampleIDList_async = function(lst, _callback, _error_callback)
    {
	json_call_ajax_async("PlantExpression.getEOSampleIDList", [lst], 1, _callback, _error_callback)
    }

    this.getPOSampleIDList = function(lst)
    {
	var resp = json_call_ajax_sync("PlantExpression.getPOSampleIDList", [lst]);
//	var resp = json_call_sync("PlantExpression.getPOSampleIDList", [lst]);
        return resp[0];
    }

    this.getPOSampleIDList_async = function(lst, _callback, _error_callback)
    {
	json_call_ajax_async("PlantExpression.getPOSampleIDList", [lst], 1, _callback, _error_callback)
    }

    this.getAllPO = function()
    {
	var resp = json_call_ajax_sync("PlantExpression.getAllPO", []);
//	var resp = json_call_sync("PlantExpression.getAllPO", []);
        return resp[0];
    }

    this.getAllPO_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("PlantExpression.getAllPO", [], 1, _callback, _error_callback)
    }

    this.getAllEO = function()
    {
	var resp = json_call_ajax_sync("PlantExpression.getAllEO", []);
//	var resp = json_call_sync("PlantExpression.getAllEO", []);
        return resp[0];
    }

    this.getAllEO_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("PlantExpression.getAllEO", [], 1, _callback, _error_callback)
    }

    this.getPODescriptions = function(ids)
    {
	var resp = json_call_ajax_sync("PlantExpression.getPODescriptions", [ids]);
//	var resp = json_call_sync("PlantExpression.getPODescriptions", [ids]);
        return resp[0];
    }

    this.getPODescriptions_async = function(ids, _callback, _error_callback)
    {
	json_call_ajax_async("PlantExpression.getPODescriptions", [ids], 1, _callback, _error_callback)
    }

    this.getEODescriptions = function(ids)
    {
	var resp = json_call_ajax_sync("PlantExpression.getEODescriptions", [ids]);
//	var resp = json_call_sync("PlantExpression.getEODescriptions", [ids]);
        return resp[0];
    }

    this.getEODescriptions_async = function(ids, _callback, _error_callback)
    {
	json_call_ajax_async("PlantExpression.getEODescriptions", [ids], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function ProteinInfo(url) {

    var _url = url;


    this.fids_to_operons = function(fids)
    {
	var resp = json_call_ajax_sync("ProteinInfo.fids_to_operons", [fids]);
//	var resp = json_call_sync("ProteinInfo.fids_to_operons", [fids]);
        return resp[0];
    }

    this.fids_to_operons_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("ProteinInfo.fids_to_operons", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_domains = function(fids)
    {
	var resp = json_call_ajax_sync("ProteinInfo.fids_to_domains", [fids]);
//	var resp = json_call_sync("ProteinInfo.fids_to_domains", [fids]);
        return resp[0];
    }

    this.fids_to_domains_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("ProteinInfo.fids_to_domains", [fids], 1, _callback, _error_callback)
    }

    this.domains_to_fids = function(domain_ids)
    {
	var resp = json_call_ajax_sync("ProteinInfo.domains_to_fids", [domain_ids]);
//	var resp = json_call_sync("ProteinInfo.domains_to_fids", [domain_ids]);
        return resp[0];
    }

    this.domains_to_fids_async = function(domain_ids, _callback, _error_callback)
    {
	json_call_ajax_async("ProteinInfo.domains_to_fids", [domain_ids], 1, _callback, _error_callback)
    }

    this.fids_to_ipr = function(fids)
    {
	var resp = json_call_ajax_sync("ProteinInfo.fids_to_ipr", [fids]);
//	var resp = json_call_sync("ProteinInfo.fids_to_ipr", [fids]);
        return resp[0];
    }

    this.fids_to_ipr_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("ProteinInfo.fids_to_ipr", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_orthologs = function(fids)
    {
	var resp = json_call_ajax_sync("ProteinInfo.fids_to_orthologs", [fids]);
//	var resp = json_call_sync("ProteinInfo.fids_to_orthologs", [fids]);
        return resp[0];
    }

    this.fids_to_orthologs_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("ProteinInfo.fids_to_orthologs", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_ec = function(fids)
    {
	var resp = json_call_ajax_sync("ProteinInfo.fids_to_ec", [fids]);
//	var resp = json_call_sync("ProteinInfo.fids_to_ec", [fids]);
        return resp[0];
    }

    this.fids_to_ec_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("ProteinInfo.fids_to_ec", [fids], 1, _callback, _error_callback)
    }

    this.fids_to_go = function(fids)
    {
	var resp = json_call_ajax_sync("ProteinInfo.fids_to_go", [fids]);
//	var resp = json_call_sync("ProteinInfo.fids_to_go", [fids]);
        return resp[0];
    }

    this.fids_to_go_async = function(fids, _callback, _error_callback)
    {
	json_call_ajax_async("ProteinInfo.fids_to_go", [fids], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function FileType(url) {

    var _url = url;


    this.get_file_type = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_file_type", [id]);
//	var resp = json_call_sync("FileType.get_file_type", [id]);
        return resp[0];
    }

    this.get_file_type_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_file_type", [id], 1, _callback, _error_callback)
    }

    this.get_this_file_type_only = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_this_file_type_only", [id]);
//	var resp = json_call_sync("FileType.get_this_file_type_only", [id]);
        return resp[0];
    }

    this.get_this_file_type_only_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_this_file_type_only", [id], 1, _callback, _error_callback)
    }

    this.get_file_type_name = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_file_type_name", [id]);
//	var resp = json_call_sync("FileType.get_file_type_name", [id]);
        return resp[0];
    }

    this.get_file_type_name_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_file_type_name", [id], 1, _callback, _error_callback)
    }

    this.get_file_type_names = function(ids)
    {
	var resp = json_call_ajax_sync("FileType.get_file_type_names", [ids]);
//	var resp = json_call_sync("FileType.get_file_type_names", [ids]);
        return resp[0];
    }

    this.get_file_type_names_async = function(ids, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_file_type_names", [ids], 1, _callback, _error_callback)
    }

    this.get_default_extension = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_default_extension", [id]);
//	var resp = json_call_sync("FileType.get_default_extension", [id]);
        return resp[0];
    }

    this.get_default_extension_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_default_extension", [id], 1, _callback, _error_callback)
    }

    this.get_default_extensions = function(ids)
    {
	var resp = json_call_ajax_sync("FileType.get_default_extensions", [ids]);
//	var resp = json_call_sync("FileType.get_default_extensions", [ids]);
        return resp[0];
    }

    this.get_default_extensions_async = function(ids, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_default_extensions", [ids], 1, _callback, _error_callback)
    }

    this.get_file_type_property = function(id, key)
    {
	var resp = json_call_ajax_sync("FileType.get_file_type_property", [id, key]);
//	var resp = json_call_sync("FileType.get_file_type_property", [id, key]);
        return resp[0];
    }

    this.get_file_type_property_async = function(id, key, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_file_type_property", [id, key], 1, _callback, _error_callback)
    }

    this.get_file_type_id_by_full_name = function(name)
    {
	var resp = json_call_ajax_sync("FileType.get_file_type_id_by_full_name", [name]);
//	var resp = json_call_sync("FileType.get_file_type_id_by_full_name", [name]);
        return resp[0];
    }

    this.get_file_type_id_by_full_name_async = function(name, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_file_type_id_by_full_name", [name], 1, _callback, _error_callback)
    }

    this.get_possible_file_type_by_extension = function(extension)
    {
	var resp = json_call_ajax_sync("FileType.get_possible_file_type_by_extension", [extension]);
//	var resp = json_call_sync("FileType.get_possible_file_type_by_extension", [extension]);
        return resp[0];
    }

    this.get_possible_file_type_by_extension_async = function(extension, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_possible_file_type_by_extension", [extension], 1, _callback, _error_callback)
    }

    this.get_possible_file_type_by_default_extension = function(extension)
    {
	var resp = json_call_ajax_sync("FileType.get_possible_file_type_by_default_extension", [extension]);
//	var resp = json_call_sync("FileType.get_possible_file_type_by_default_extension", [extension]);
        return resp[0];
    }

    this.get_possible_file_type_by_default_extension_async = function(extension, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_possible_file_type_by_default_extension", [extension], 1, _callback, _error_callback)
    }

    this.get_parent = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_parent", [id]);
//	var resp = json_call_sync("FileType.get_parent", [id]);
        return resp[0];
    }

    this.get_parent_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_parent", [id], 1, _callback, _error_callback)
    }

    this.get_all_children = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_all_children", [id]);
//	var resp = json_call_sync("FileType.get_all_children", [id]);
        return resp[0];
    }

    this.get_all_children_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_all_children", [id], 1, _callback, _error_callback)
    }

    this.get_ancestry = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_ancestry", [id]);
//	var resp = json_call_sync("FileType.get_ancestry", [id]);
        return resp[0];
    }

    this.get_ancestry_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_ancestry", [id], 1, _callback, _error_callback)
    }

    this.get_all_descendants = function(id)
    {
	var resp = json_call_ajax_sync("FileType.get_all_descendants", [id]);
//	var resp = json_call_sync("FileType.get_all_descendants", [id]);
        return resp[0];
    }

    this.get_all_descendants_async = function(id, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.get_all_descendants", [id], 1, _callback, _error_callback)
    }

    this.dump_file_type_hierarchy_in_newick = function()
    {
	var resp = json_call_ajax_sync("FileType.dump_file_type_hierarchy_in_newick", []);
//	var resp = json_call_sync("FileType.dump_file_type_hierarchy_in_newick", []);
        return resp[0];
    }

    this.dump_file_type_hierarchy_in_newick_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("FileType.dump_file_type_hierarchy_in_newick", [], 1, _callback, _error_callback)
    }

    this.dump_file_type_hierarchy_pretty = function()
    {
	var resp = json_call_ajax_sync("FileType.dump_file_type_hierarchy_pretty", []);
//	var resp = json_call_sync("FileType.dump_file_type_hierarchy_pretty", []);
        return resp[0];
    }

    this.dump_file_type_hierarchy_pretty_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("FileType.dump_file_type_hierarchy_pretty", [], 1, _callback, _error_callback)
    }

    this.all_file_type_ids = function()
    {
	var resp = json_call_ajax_sync("FileType.all_file_type_ids", []);
//	var resp = json_call_sync("FileType.all_file_type_ids", []);
        return resp[0];
    }

    this.all_file_type_ids_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("FileType.all_file_type_ids", [], 1, _callback, _error_callback)
    }

    this.all_file_type_property = function(propertyName)
    {
	var resp = json_call_ajax_sync("FileType.all_file_type_property", [propertyName]);
//	var resp = json_call_sync("FileType.all_file_type_property", [propertyName]);
        return resp[0];
    }

    this.all_file_type_property_async = function(propertyName, _callback, _error_callback)
    {
	json_call_ajax_async("FileType.all_file_type_property", [propertyName], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function Ontology(url) {

    var _url = url;


    this.getGOIDList = function(sname, geneIDList, domainList, ecList)
    {
	var resp = json_call_ajax_sync("Ontology.getGOIDList", [sname, geneIDList, domainList, ecList]);
//	var resp = json_call_sync("Ontology.getGOIDList", [sname, geneIDList, domainList, ecList]);
        return resp[0];
    }

    this.getGOIDList_async = function(sname, geneIDList, domainList, ecList, _callback, _error_callback)
    {
	json_call_ajax_async("Ontology.getGOIDList", [sname, geneIDList, domainList, ecList], 1, _callback, _error_callback)
    }

    this.getGoDesc = function(goIDList)
    {
	var resp = json_call_ajax_sync("Ontology.getGoDesc", [goIDList]);
//	var resp = json_call_sync("Ontology.getGoDesc", [goIDList]);
        return resp[0];
    }

    this.getGoDesc_async = function(goIDList, _callback, _error_callback)
    {
	json_call_ajax_async("Ontology.getGoDesc", [goIDList], 1, _callback, _error_callback)
    }

    this.getGOEnrichment = function(sname, geneIDList, domainList, ecList, type)
    {
	var resp = json_call_ajax_sync("Ontology.getGOEnrichment", [sname, geneIDList, domainList, ecList, type]);
//	var resp = json_call_sync("Ontology.getGOEnrichment", [sname, geneIDList, domainList, ecList, type]);
        return resp[0];
    }

    this.getGOEnrichment_async = function(sname, geneIDList, domainList, ecList, type, _callback, _error_callback)
    {
	json_call_ajax_async("Ontology.getGOEnrichment", [sname, geneIDList, domainList, ecList, type], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function Tree(url) {

    var _url = url;


    this.replace_node_names = function(tree, replacements)
    {
	var resp = json_call_ajax_sync("Tree.replace_node_names", [tree, replacements]);
//	var resp = json_call_sync("Tree.replace_node_names", [tree, replacements]);
        return resp[0];
    }

    this.replace_node_names_async = function(tree, replacements, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.replace_node_names", [tree, replacements], 1, _callback, _error_callback)
    }

    this.remove_node_names_and_simplify = function(tree, removal_list)
    {
	var resp = json_call_ajax_sync("Tree.remove_node_names_and_simplify", [tree, removal_list]);
//	var resp = json_call_sync("Tree.remove_node_names_and_simplify", [tree, removal_list]);
        return resp[0];
    }

    this.remove_node_names_and_simplify_async = function(tree, removal_list, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.remove_node_names_and_simplify", [tree, removal_list], 1, _callback, _error_callback)
    }

    this.extract_leaf_node_names = function(tree)
    {
	var resp = json_call_ajax_sync("Tree.extract_leaf_node_names", [tree]);
//	var resp = json_call_sync("Tree.extract_leaf_node_names", [tree]);
        return resp[0];
    }

    this.extract_leaf_node_names_async = function(tree, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.extract_leaf_node_names", [tree], 1, _callback, _error_callback)
    }

    this.extract_node_names = function(tree)
    {
	var resp = json_call_ajax_sync("Tree.extract_node_names", [tree]);
//	var resp = json_call_sync("Tree.extract_node_names", [tree]);
        return resp[0];
    }

    this.extract_node_names_async = function(tree, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.extract_node_names", [tree], 1, _callback, _error_callback)
    }

    this.get_node_count = function(tree)
    {
	var resp = json_call_ajax_sync("Tree.get_node_count", [tree]);
//	var resp = json_call_sync("Tree.get_node_count", [tree]);
        return resp[0];
    }

    this.get_node_count_async = function(tree, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.get_node_count", [tree], 1, _callback, _error_callback)
    }

    this.get_leaf_count = function(tree)
    {
	var resp = json_call_ajax_sync("Tree.get_leaf_count", [tree]);
//	var resp = json_call_sync("Tree.get_leaf_count", [tree]);
        return resp[0];
    }

    this.get_leaf_count_async = function(tree, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.get_leaf_count", [tree], 1, _callback, _error_callback)
    }

    this.get_tree = function(tree_id, options)
    {
	var resp = json_call_ajax_sync("Tree.get_tree", [tree_id, options]);
//	var resp = json_call_sync("Tree.get_tree", [tree_id, options]);
        return resp[0];
    }

    this.get_tree_async = function(tree_id, options, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.get_tree", [tree_id, options], 1, _callback, _error_callback)
    }

    this.get_tree_data = function(tree_ids)
    {
	var resp = json_call_ajax_sync("Tree.get_tree_data", [tree_ids]);
//	var resp = json_call_sync("Tree.get_tree_data", [tree_ids]);
        return resp[0];
    }

    this.get_tree_data_async = function(tree_ids, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.get_tree_data", [tree_ids], 1, _callback, _error_callback)
    }

    this.get_alignment_data = function(alignment_ids)
    {
	var resp = json_call_ajax_sync("Tree.get_alignment_data", [alignment_ids]);
//	var resp = json_call_sync("Tree.get_alignment_data", [alignment_ids]);
        return resp[0];
    }

    this.get_alignment_data_async = function(alignment_ids, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.get_alignment_data", [alignment_ids], 1, _callback, _error_callback)
    }

    this.get_tree_ids_by_feature = function(feature_ids)
    {
	var resp = json_call_ajax_sync("Tree.get_tree_ids_by_feature", [feature_ids]);
//	var resp = json_call_sync("Tree.get_tree_ids_by_feature", [feature_ids]);
        return resp[0];
    }

    this.get_tree_ids_by_feature_async = function(feature_ids, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.get_tree_ids_by_feature", [feature_ids], 1, _callback, _error_callback)
    }

    this.get_tree_ids_by_protein_sequence = function(protein_sequence_ids)
    {
	var resp = json_call_ajax_sync("Tree.get_tree_ids_by_protein_sequence", [protein_sequence_ids]);
//	var resp = json_call_sync("Tree.get_tree_ids_by_protein_sequence", [protein_sequence_ids]);
        return resp[0];
    }

    this.get_tree_ids_by_protein_sequence_async = function(protein_sequence_ids, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.get_tree_ids_by_protein_sequence", [protein_sequence_ids], 1, _callback, _error_callback)
    }

    this.get_alignment_ids_by_feature = function(feature_ids)
    {
	var resp = json_call_ajax_sync("Tree.get_alignment_ids_by_feature", [feature_ids]);
//	var resp = json_call_sync("Tree.get_alignment_ids_by_feature", [feature_ids]);
        return resp[0];
    }

    this.get_alignment_ids_by_feature_async = function(feature_ids, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.get_alignment_ids_by_feature", [feature_ids], 1, _callback, _error_callback)
    }

    this.get_alignment_ids_by_protein_sequence = function(protein_sequence_ids)
    {
	var resp = json_call_ajax_sync("Tree.get_alignment_ids_by_protein_sequence", [protein_sequence_ids]);
//	var resp = json_call_sync("Tree.get_alignment_ids_by_protein_sequence", [protein_sequence_ids]);
        return resp[0];
    }

    this.get_alignment_ids_by_protein_sequence_async = function(protein_sequence_ids, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.get_alignment_ids_by_protein_sequence", [protein_sequence_ids], 1, _callback, _error_callback)
    }

    this.draw_html_tree = function(tree, display_options)
    {
	var resp = json_call_ajax_sync("Tree.draw_html_tree", [tree, display_options]);
//	var resp = json_call_sync("Tree.draw_html_tree", [tree, display_options]);
        return resp[0];
    }

    this.draw_html_tree_async = function(tree, display_options, _callback, _error_callback)
    {
	json_call_ajax_async("Tree.draw_html_tree", [tree, display_options], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function workspaceService(url) {

    var _url = url;


    this.save_object = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.save_object", [params]);
//	var resp = json_call_sync("workspaceService.save_object", [params]);
        return resp[0];
    }

    this.save_object_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.save_object", [params], 1, _callback, _error_callback)
    }

    this.delete_object = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.delete_object", [params]);
//	var resp = json_call_sync("workspaceService.delete_object", [params]);
        return resp[0];
    }

    this.delete_object_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.delete_object", [params], 1, _callback, _error_callback)
    }

    this.delete_object_permanently = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.delete_object_permanently", [params]);
//	var resp = json_call_sync("workspaceService.delete_object_permanently", [params]);
        return resp[0];
    }

    this.delete_object_permanently_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.delete_object_permanently", [params], 1, _callback, _error_callback)
    }

    this.get_object = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.get_object", [params]);
//	var resp = json_call_sync("workspaceService.get_object", [params]);
        return resp[0];
    }

    this.get_object_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_object", [params], 1, _callback, _error_callback)
    }

    this.get_objectmeta = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.get_objectmeta", [params]);
//	var resp = json_call_sync("workspaceService.get_objectmeta", [params]);
        return resp[0];
    }

    this.get_objectmeta_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_objectmeta", [params], 1, _callback, _error_callback)
    }

    this.revert_object = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.revert_object", [params]);
//	var resp = json_call_sync("workspaceService.revert_object", [params]);
        return resp[0];
    }

    this.revert_object_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.revert_object", [params], 1, _callback, _error_callback)
    }

    this.copy_object = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.copy_object", [params]);
//	var resp = json_call_sync("workspaceService.copy_object", [params]);
        return resp[0];
    }

    this.copy_object_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.copy_object", [params], 1, _callback, _error_callback)
    }

    this.move_object = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.move_object", [params]);
//	var resp = json_call_sync("workspaceService.move_object", [params]);
        return resp[0];
    }

    this.move_object_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.move_object", [params], 1, _callback, _error_callback)
    }

    this.has_object = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.has_object", [params]);
//	var resp = json_call_sync("workspaceService.has_object", [params]);
        return resp[0];
    }

    this.has_object_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.has_object", [params], 1, _callback, _error_callback)
    }

    this.object_history = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.object_history", [params]);
//	var resp = json_call_sync("workspaceService.object_history", [params]);
        return resp[0];
    }

    this.object_history_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.object_history", [params], 1, _callback, _error_callback)
    }

    this.create_workspace = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.create_workspace", [params]);
//	var resp = json_call_sync("workspaceService.create_workspace", [params]);
        return resp[0];
    }

    this.create_workspace_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.create_workspace", [params], 1, _callback, _error_callback)
    }

    this.get_workspacemeta = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.get_workspacemeta", [params]);
//	var resp = json_call_sync("workspaceService.get_workspacemeta", [params]);
        return resp[0];
    }

    this.get_workspacemeta_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_workspacemeta", [params], 1, _callback, _error_callback)
    }

    this.get_workspacepermissions = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.get_workspacepermissions", [params]);
//	var resp = json_call_sync("workspaceService.get_workspacepermissions", [params]);
        return resp[0];
    }

    this.get_workspacepermissions_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_workspacepermissions", [params], 1, _callback, _error_callback)
    }

    this.delete_workspace = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.delete_workspace", [params]);
//	var resp = json_call_sync("workspaceService.delete_workspace", [params]);
        return resp[0];
    }

    this.delete_workspace_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.delete_workspace", [params], 1, _callback, _error_callback)
    }

    this.clone_workspace = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.clone_workspace", [params]);
//	var resp = json_call_sync("workspaceService.clone_workspace", [params]);
        return resp[0];
    }

    this.clone_workspace_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.clone_workspace", [params], 1, _callback, _error_callback)
    }

    this.list_workspaces = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.list_workspaces", [params]);
//	var resp = json_call_sync("workspaceService.list_workspaces", [params]);
        return resp[0];
    }

    this.list_workspaces_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.list_workspaces", [params], 1, _callback, _error_callback)
    }

    this.list_workspace_objects = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.list_workspace_objects", [params]);
//	var resp = json_call_sync("workspaceService.list_workspace_objects", [params]);
        return resp[0];
    }

    this.list_workspace_objects_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.list_workspace_objects", [params], 1, _callback, _error_callback)
    }

    this.set_global_workspace_permissions = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.set_global_workspace_permissions", [params]);
//	var resp = json_call_sync("workspaceService.set_global_workspace_permissions", [params]);
        return resp[0];
    }

    this.set_global_workspace_permissions_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.set_global_workspace_permissions", [params], 1, _callback, _error_callback)
    }

    this.set_workspace_permissions = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.set_workspace_permissions", [params]);
//	var resp = json_call_sync("workspaceService.set_workspace_permissions", [params]);
        return resp[0];
    }

    this.set_workspace_permissions_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.set_workspace_permissions", [params], 1, _callback, _error_callback)
    }

    this.get_user_settings = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.get_user_settings", [params]);
//	var resp = json_call_sync("workspaceService.get_user_settings", [params]);
        return resp[0];
    }

    this.get_user_settings_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_user_settings", [params], 1, _callback, _error_callback)
    }

    this.set_user_settings = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.set_user_settings", [params]);
//	var resp = json_call_sync("workspaceService.set_user_settings", [params]);
        return resp[0];
    }

    this.set_user_settings_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.set_user_settings", [params], 1, _callback, _error_callback)
    }

    this.queue_job = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.queue_job", [params]);
//	var resp = json_call_sync("workspaceService.queue_job", [params]);
        return resp[0];
    }

    this.queue_job_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.queue_job", [params], 1, _callback, _error_callback)
    }

    this.set_job_status = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.set_job_status", [params]);
//	var resp = json_call_sync("workspaceService.set_job_status", [params]);
        return resp[0];
    }

    this.set_job_status_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.set_job_status", [params], 1, _callback, _error_callback)
    }

    this.get_jobs = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.get_jobs", [params]);
//	var resp = json_call_sync("workspaceService.get_jobs", [params]);
        return resp[0];
    }

    this.get_jobs_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_jobs", [params], 1, _callback, _error_callback)
    }

    this.get_types = function()
    {
	var resp = json_call_ajax_sync("workspaceService.get_types", []);
//	var resp = json_call_sync("workspaceService.get_types", []);
        return resp[0];
    }

    this.get_types_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_types", [], 1, _callback, _error_callback)
    }

    this.add_type = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.add_type", [params]);
//	var resp = json_call_sync("workspaceService.add_type", [params]);
        return resp[0];
    }

    this.add_type_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.add_type", [params], 1, _callback, _error_callback)
    }

    this.remove_type = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.remove_type", [params]);
//	var resp = json_call_sync("workspaceService.remove_type", [params]);
        return resp[0];
    }

    this.remove_type_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.remove_type", [params], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function fbaModelServices(url) {

    var _url = url;


    this.get_models = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_models", [input]);
//	var resp = json_call_sync("fbaModelServices.get_models", [input]);
        return resp[0];
    }

    this.get_models_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_models", [input], 1, _callback, _error_callback)
    }

    this.get_fbas = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_fbas", [input]);
//	var resp = json_call_sync("fbaModelServices.get_fbas", [input]);
        return resp[0];
    }

    this.get_fbas_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_fbas", [input], 1, _callback, _error_callback)
    }

    this.get_gapfills = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_gapfills", [input]);
//	var resp = json_call_sync("fbaModelServices.get_gapfills", [input]);
        return resp[0];
    }

    this.get_gapfills_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_gapfills", [input], 1, _callback, _error_callback)
    }

    this.get_gapgens = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_gapgens", [input]);
//	var resp = json_call_sync("fbaModelServices.get_gapgens", [input]);
        return resp[0];
    }

    this.get_gapgens_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_gapgens", [input], 1, _callback, _error_callback)
    }

    this.get_reactions = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_reactions", [input]);
//	var resp = json_call_sync("fbaModelServices.get_reactions", [input]);
        return resp[0];
    }

    this.get_reactions_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_reactions", [input], 1, _callback, _error_callback)
    }

    this.get_compounds = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_compounds", [input]);
//	var resp = json_call_sync("fbaModelServices.get_compounds", [input]);
        return resp[0];
    }

    this.get_compounds_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_compounds", [input], 1, _callback, _error_callback)
    }

    this.get_media = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_media", [input]);
//	var resp = json_call_sync("fbaModelServices.get_media", [input]);
        return resp[0];
    }

    this.get_media_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_media", [input], 1, _callback, _error_callback)
    }

    this.get_biochemistry = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_biochemistry", [input]);
//	var resp = json_call_sync("fbaModelServices.get_biochemistry", [input]);
        return resp[0];
    }

    this.get_biochemistry_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_biochemistry", [input], 1, _callback, _error_callback)
    }

    this.genome_object_to_workspace = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.genome_object_to_workspace", [input]);
//	var resp = json_call_sync("fbaModelServices.genome_object_to_workspace", [input]);
        return resp[0];
    }

    this.genome_object_to_workspace_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.genome_object_to_workspace", [input], 1, _callback, _error_callback)
    }

    this.genome_to_workspace = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.genome_to_workspace", [input]);
//	var resp = json_call_sync("fbaModelServices.genome_to_workspace", [input]);
        return resp[0];
    }

    this.genome_to_workspace_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.genome_to_workspace", [input], 1, _callback, _error_callback)
    }

    this.add_feature_translation = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.add_feature_translation", [input]);
//	var resp = json_call_sync("fbaModelServices.add_feature_translation", [input]);
        return resp[0];
    }

    this.add_feature_translation_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.add_feature_translation", [input], 1, _callback, _error_callback)
    }

    this.genome_to_fbamodel = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.genome_to_fbamodel", [input]);
//	var resp = json_call_sync("fbaModelServices.genome_to_fbamodel", [input]);
        return resp[0];
    }

    this.genome_to_fbamodel_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.genome_to_fbamodel", [input], 1, _callback, _error_callback)
    }

    this.export_fbamodel = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.export_fbamodel", [input]);
//	var resp = json_call_sync("fbaModelServices.export_fbamodel", [input]);
        return resp[0];
    }

    this.export_fbamodel_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.export_fbamodel", [input], 1, _callback, _error_callback)
    }

    this.adjust_model_reaction = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.adjust_model_reaction", [input]);
//	var resp = json_call_sync("fbaModelServices.adjust_model_reaction", [input]);
        return resp[0];
    }

    this.adjust_model_reaction_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.adjust_model_reaction", [input], 1, _callback, _error_callback)
    }

    this.adjust_biomass_reaction = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.adjust_biomass_reaction", [input]);
//	var resp = json_call_sync("fbaModelServices.adjust_biomass_reaction", [input]);
        return resp[0];
    }

    this.adjust_biomass_reaction_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.adjust_biomass_reaction", [input], 1, _callback, _error_callback)
    }

    this.addmedia = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.addmedia", [input]);
//	var resp = json_call_sync("fbaModelServices.addmedia", [input]);
        return resp[0];
    }

    this.addmedia_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.addmedia", [input], 1, _callback, _error_callback)
    }

    this.export_media = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.export_media", [input]);
//	var resp = json_call_sync("fbaModelServices.export_media", [input]);
        return resp[0];
    }

    this.export_media_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.export_media", [input], 1, _callback, _error_callback)
    }

    this.runfba = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.runfba", [input]);
//	var resp = json_call_sync("fbaModelServices.runfba", [input]);
        return resp[0];
    }

    this.runfba_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.runfba", [input], 1, _callback, _error_callback)
    }

    this.export_fba = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.export_fba", [input]);
//	var resp = json_call_sync("fbaModelServices.export_fba", [input]);
        return resp[0];
    }

    this.export_fba_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.export_fba", [input], 1, _callback, _error_callback)
    }

    this.import_phenotypes = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.import_phenotypes", [input]);
//	var resp = json_call_sync("fbaModelServices.import_phenotypes", [input]);
        return resp[0];
    }

    this.import_phenotypes_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.import_phenotypes", [input], 1, _callback, _error_callback)
    }

    this.simulate_phenotypes = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.simulate_phenotypes", [input]);
//	var resp = json_call_sync("fbaModelServices.simulate_phenotypes", [input]);
        return resp[0];
    }

    this.simulate_phenotypes_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.simulate_phenotypes", [input], 1, _callback, _error_callback)
    }

    this.export_phenotypeSimulationSet = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.export_phenotypeSimulationSet", [input]);
//	var resp = json_call_sync("fbaModelServices.export_phenotypeSimulationSet", [input]);
        return resp[0];
    }

    this.export_phenotypeSimulationSet_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.export_phenotypeSimulationSet", [input], 1, _callback, _error_callback)
    }

    this.integrate_reconciliation_solutions = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.integrate_reconciliation_solutions", [input]);
//	var resp = json_call_sync("fbaModelServices.integrate_reconciliation_solutions", [input]);
        return resp[0];
    }

    this.integrate_reconciliation_solutions_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.integrate_reconciliation_solutions", [input], 1, _callback, _error_callback)
    }

    this.queue_runfba = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.queue_runfba", [input]);
//	var resp = json_call_sync("fbaModelServices.queue_runfba", [input]);
        return resp[0];
    }

    this.queue_runfba_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.queue_runfba", [input], 1, _callback, _error_callback)
    }

    this.queue_gapfill_model = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.queue_gapfill_model", [input]);
//	var resp = json_call_sync("fbaModelServices.queue_gapfill_model", [input]);
        return resp[0];
    }

    this.queue_gapfill_model_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.queue_gapfill_model", [input], 1, _callback, _error_callback)
    }

    this.queue_gapgen_model = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.queue_gapgen_model", [input]);
//	var resp = json_call_sync("fbaModelServices.queue_gapgen_model", [input]);
        return resp[0];
    }

    this.queue_gapgen_model_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.queue_gapgen_model", [input], 1, _callback, _error_callback)
    }

    this.queue_wildtype_phenotype_reconciliation = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.queue_wildtype_phenotype_reconciliation", [input]);
//	var resp = json_call_sync("fbaModelServices.queue_wildtype_phenotype_reconciliation", [input]);
        return resp[0];
    }

    this.queue_wildtype_phenotype_reconciliation_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.queue_wildtype_phenotype_reconciliation", [input], 1, _callback, _error_callback)
    }

    this.queue_reconciliation_sensitivity_analysis = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.queue_reconciliation_sensitivity_analysis", [input]);
//	var resp = json_call_sync("fbaModelServices.queue_reconciliation_sensitivity_analysis", [input]);
        return resp[0];
    }

    this.queue_reconciliation_sensitivity_analysis_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.queue_reconciliation_sensitivity_analysis", [input], 1, _callback, _error_callback)
    }

    this.queue_combine_wildtype_phenotype_reconciliation = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.queue_combine_wildtype_phenotype_reconciliation", [input]);
//	var resp = json_call_sync("fbaModelServices.queue_combine_wildtype_phenotype_reconciliation", [input]);
        return resp[0];
    }

    this.queue_combine_wildtype_phenotype_reconciliation_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.queue_combine_wildtype_phenotype_reconciliation", [input], 1, _callback, _error_callback)
    }

    this.jobs_done = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.jobs_done", [input]);
//	var resp = json_call_sync("fbaModelServices.jobs_done", [input]);
        return resp[0];
    }

    this.jobs_done_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.jobs_done", [input], 1, _callback, _error_callback)
    }

    this.check_job = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.check_job", [input]);
//	var resp = json_call_sync("fbaModelServices.check_job", [input]);
        return resp[0];
    }

    this.check_job_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.check_job", [input], 1, _callback, _error_callback)
    }

    this.run_job = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.run_job", [input]);
//	var resp = json_call_sync("fbaModelServices.run_job", [input]);
        return resp[0];
    }

    this.run_job_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.run_job", [input], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function ERDB_Service(url) {

    var _url = url;


    this.GetAll = function(objectNames, filterClause, parameters, fields, count)
    {
	var resp = json_call_ajax_sync("ERDB_Service.GetAll", [objectNames, filterClause, parameters, fields, count]);
//	var resp = json_call_sync("ERDB_Service.GetAll", [objectNames, filterClause, parameters, fields, count]);
        return resp[0];
    }

    this.GetAll_async = function(objectNames, filterClause, parameters, fields, count, _callback, _error_callback)
    {
	json_call_ajax_async("ERDB_Service.GetAll", [objectNames, filterClause, parameters, fields, count], 1, _callback, _error_callback)
    }

    this.runSQL = function(SQLstring, parameters)
    {
	var resp = json_call_ajax_sync("ERDB_Service.runSQL", [SQLstring, parameters]);
//	var resp = json_call_sync("ERDB_Service.runSQL", [SQLstring, parameters]);
        return resp[0];
    }

    this.runSQL_async = function(SQLstring, parameters, _callback, _error_callback)
    {
	json_call_ajax_async("ERDB_Service.runSQL", [SQLstring, parameters], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}

