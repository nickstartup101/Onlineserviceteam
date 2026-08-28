<!-- Batch Month Modal (Updated) -->
    <div id="batchMonthModal" class="fixed inset-0 bg-slate-900/60 z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden font-lao">
            <div class="p-5 bg-purple-900 text-white flex justify-between items-center">
                <h3 class="font-bold text-sm">📅 ສ້າງຕາຕະລາງລ່ວງໜ້າຫຼາຍເດືອນ</h3>
                <button type="button" onclick="document.getElementById('batchMonthModal').classList.add('hidden')" class="text-white/80 hover:text-white">✕</button>
            </div>
            <div class="p-6 space-y-4 text-xs">
                <div>
                    <label class="block font-semibold mb-1 text-slate-700">ເລືອກກຸ່ມພະນັກງານ:</label>
                    <select id="batchTargetGroupSelect" class="w-full border border-slate-300 rounded-xl p-2.5 outline-none bg-slate-50 font-bold text-purple-950"></select>
                </div>
                <div>
                    <label class="block font-semibold mb-1 text-slate-700">ເລືອກເດືອນເລີ່ມຕົ້ນ:</label>
                    <input type="month" id="batchStartMonth" value="2026-10" class="w-full border border-slate-300 rounded-xl p-2.5 outline-none bg-slate-50 font-bold"/>
                </div>
                <div>
                    <label class="block font-semibold mb-1 text-slate-700">ຈຳນວນເດືອນທີ່ຕ້ອງການສ້າງລ່ວງໜ້າ:</label>
                    <select id="batchMonthCount" class="w-full border border-slate-300 rounded-xl p-2.5 outline-none bg-slate-50 font-bold">
                        <option value="3">3 ເດືອນ (ເຊັ່ນ: 10/2026 ຫາ 12/2026)</option>
                        <option value="6" selected>6 ເດືອນ (ເຊັ່ນ: 10/2026 ຫາ 03/2027)</option>
                        <option value="12">12 ເດືອນ (ເຕັມ 1 ປີ)</option>
                    </select>
                </div>
                <div class="flex justify-end gap-2 pt-2 border-t">
                    <button type="button" onclick="document.getElementById('batchMonthModal').classList.add('hidden')" class="px-4 py-2 border rounded-xl">ຍົກເລີກ</button>
                    <button type="button" onclick="executeBatchMonthGenerate()" class="px-5 py-2 bg-purple-800 hover:bg-purple-900 text-white rounded-xl font-bold shadow">ສ້າງຕາຕະລາງລ່ວງໜ້າ</button>
                </div>
            </div>
        </div>
    </div>
