extends Node2D

# 이식 스캐폴드의 진입점. 게임 로직은 아직 없다 —
# Godot MCP 가 붙을 수 있는 최소한의 실행 가능한 프로젝트를 만드는 것이 목적이다.
# 이식 순서는 godot/PORT.md 를 따른다.

func _ready() -> void:
	print("scaffold ok — godot ", Engine.get_version_info().string)
