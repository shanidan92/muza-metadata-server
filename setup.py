from setuptools import setup, find_packages

setup(
    name="muza-metadata-server",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "Flask==2.3.3",
        "graphene==3.3.0",
        "gunicorn==21.2.0",
    ],
    entry_points={
        "console_scripts": [
            "muza-metadata-server=muza_metadata_server.cli:main",
        ],
    },
    python_requires=">=3.8",
    include_package_data=True,
    author="Yaacov Zamir",
    author_email="kobi.zamir@gmail.com",
    description="A metadata server for music tracks with GraphQL API",
    keywords="music, metadata, graphql",
    url="https://github.com/yaacov/muza-metadata-server",
    project_urls={
        "Bug Tracker": "https://github.com/yaacov/muza-metadata-server/issues",
    },
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
