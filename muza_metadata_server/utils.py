import json
import logging
import subprocess


def run_hook(hook_command, data):
    """
    Run a hook command with the provided data as JSON string argument.

    Args:
        hook_command (str): The command to execute
        data (dict): The data to pass as JSON
    """
    if not hook_command:
        return

    try:
        json_str = json.dumps(data)
        subprocess.run([hook_command, json_str], check=True)
    except subprocess.CalledProcessError as e:
        logging.error(f"Hook command failed with exit code {e.returncode}")
    except Exception as e:
        logging.error(f"Failed to run hook: {str(e)}")
