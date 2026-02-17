# Debian Latest Image
FROM mcr.microsoft.com/devcontainers/base:debian

# Installing General Packages
RUN apt update && apt install -y \
    7zip \
    fd-find \
    ffmpeg \
    file \
    fzf \
    imagemagick \
    poppler-utils \
    ripgrep \
    xclip \
    zoxide \
    jq \
    curl \
    fastfetch \
    btop \
    gpg \
    git

# Setup Flatpak
RUN apt install -y \
    flatpak \
    flatpak-builder && \
    flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo && \
    flatpak install -y flathub org.gnome.Platform//49 && \
    flatpak install -y flathub org.gnome.Sdk//49 && \
    flatpak install -y flathub org.freedesktop.Sdk.Extension.rust-stable//25.08 && \
    flatpak install -y flathub org.freedesktop.Sdk.Extension.node22//25.08

# Setup uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

# Setup Lazygit
RUN LAZYGIT_VERSION=$(curl -s "https://api.github.com/repos/jesseduffield/lazygit/releases/latest" | grep -Po '"tag_name": *"v\K[^"]*') && \
    curl -Lo lazygit.tar.gz "https://github.com/jesseduffield/lazygit/releases/download/v${LAZYGIT_VERSION}/lazygit_${LAZYGIT_VERSION}_Linux_x86_64.tar.gz" && \
    tar xf lazygit.tar.gz lazygit && \
    install lazygit -D -t /usr/local/bin/

RUN mkdir -p ~/bin && \ 
    curl -L https://raw.github.com/ymattw/ydiff/master/ydiff.py > ~/bin/ydiff && \
    chmod +x ~/bin/ydiff

# Download the latest yazi .deb package using the GitHub API
RUN curl -L -o /tmp/yazi.deb "https://github.com/sxyazi/yazi/releases/latest/download/yazi-x86_64-unknown-linux-gnu.deb" \
    && dpkg -i /tmp/yazi.deb \
    && rm -rf /tmp/yazi.deb

# Setup up Eza
RUN sudo mkdir -p /etc/apt/keyrings && \
    wget -qO- https://raw.githubusercontent.com/eza-community/eza/main/deb.asc | sudo gpg --dearmor -o /etc/apt/keyrings/gierens.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/gierens.gpg] http://deb.gierens.de stable main" | sudo tee /etc/apt/sources.list.d/gierens.list && \
    sudo chmod 644 /etc/apt/keyrings/gierens.gpg /etc/apt/sources.list.d/gierens.list && \
    sudo apt update && \
    sudo apt install -y eza

# Setup up Fish
RUN chsh -s /bin/fish

# CLone my config
RUN sh -c "$(curl -fsLS get.chezmoi.io)" -- init --apply keshav-writes-code