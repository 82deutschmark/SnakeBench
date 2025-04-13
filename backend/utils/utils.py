import yaml

def load_model_configs():
    try:
        with open("model_lists/model_list.yaml", 'r') as f:
            all_model_configs = yaml.safe_load(f)['models']
        # Create a lookup map for faster access
        model_config_map = {cfg['name']: cfg for cfg in all_model_configs}
        return model_config_map
    except FileNotFoundError:
        print(f"Error: Model list file not found at {args.model_list_path}")
        return
    except KeyError:
         print(f"Error: Could not find 'models' key in {args.model_list_path}")
         return
    except Exception as e:
        print(f"Error loading or parsing model list YAML: {e}")
        return