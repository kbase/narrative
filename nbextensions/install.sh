dir=$(pwd)
narrdir=$(cd ..;pwd)

export NARRATIVE_DIR=$narrdir
export JUPYTER_CONFIG_DIR=$narrdir/kbase-extension
export JUPYTER_RUNTIME_DIR=/tmp/jupyter_runtime
export JUPYTER_DATA_DIR=/tmp/jupyter_data
export JUPYTER_PATH=$narrdir/kbase-extension
export IPYTHONDIR=$narrdir/kbase-extension/ipython

echo 'Root dir'
echo ${dir}

jupyter nbextension install ${dir}/viewCell --symlink --sys-prefix
jupyter nbextension enable viewCell/main --sys-prefix

jupyter nbextension install ${dir}/outputCell --symlink --sys-prefix
jupyter nbextension enable outputCell/main --sys-prefix

jupyter nbextension install ${dir}/dataCell --symlink --sys-prefix
jupyter nbextension enable dataCell/main --sys-prefix

jupyter nbextension install ${dir}/editorCell --symlink --sys-prefix
jupyter nbextension enable editorCell/main --sys-prefix

jupyter nbextension install ${dir}/appCell2 --symlink --sys-prefix
jupyter nbextension enable appCell2/main --sys-prefix

jupyter nbextension install ${dir}/advancedViewCell --symlink --sys-prefix
jupyter nbextension enable advancedViewCell/main --sys-prefix

jupyter nbextension install ${dir}/codeCell --symlink --sys-prefix
jupyter nbextension enable codeCell/main --sys-prefix
