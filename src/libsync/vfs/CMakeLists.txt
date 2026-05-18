# SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
# SPDX-License-Identifier: GPL-2.0-or-later
#
# Globbing for plugins has a problem with in-source builds
# that create directories for the build.
#file(GLOB VIRTUAL_FILE_SYSTEM_PLUGINS RELATIVE ${CMAKE_CURRENT_LIST_DIR} "*")

# Karsaaz: re-enabled cfapi after Inkscape was installed (the icon generator
# the cfapi shellext needs lives under src/libsync/vfs/cfapi/shellext/).
# cfapi provides Windows-native Cloud Files API placeholders ("Files on
# Demand"); the suffix plugin is the cross-platform fallback. xattr is
# Linux/macOS only — its CMakeLists no-ops on Windows so listing it is safe.
list(APPEND VIRTUAL_FILE_SYSTEM_PLUGINS "suffix" "xattr" "cfapi")

message("list of plugins ${VIRTUAL_FILE_SYSTEM_PLUGINS}")

foreach(vfsPlugin ${VIRTUAL_FILE_SYSTEM_PLUGINS})
    set(vfsPluginPath ${vfsPlugin})
    get_filename_component(vfsPluginName ${vfsPlugin} NAME)
    message("discovery ${vfsPlugin}")
    if (NOT IS_ABSOLUTE ${vfsPlugin})
        set(vfsPluginPath "${CMAKE_CURRENT_SOURCE_DIR}/${vfsPlugin}")
        message("${vfsPluginPath}")
    endif()
    if(NOT IS_DIRECTORY ${vfsPluginPath})
        continue()
    endif()

        message("${vfsPluginPath} ${vfsPluginName}")
    add_subdirectory(${vfsPluginPath} ${vfsPluginName})

    if(UNIT_TESTING AND IS_DIRECTORY "${vfsPluginPath}/test")
        add_subdirectory("${vfsPluginPath}/test" "${vfsPluginName}_test")
        message(STATUS "Added vfsPlugin with tests: ${vfsPluginName}")
    else()
        message(STATUS "Added vfsPlugin without tests: ${vfsPluginName}")
    endif()
endforeach()
