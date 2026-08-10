{ pkgs, ... }:
{
  name = "storm-software/minimal-template";

  dotenv.enable = true;
  dotenv.filename = [
    ".env"
    ".env.local"
  ];
  dotenv.disableHint = true;

  packages = with pkgs; [
    zizmor
  ];
}
